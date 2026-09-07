import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { MESSAGE_STATUS } from '../../src/constants/domain.js';
import {
  createMessageIdempotencyKey,
  normalizeIndianPhone,
  renderMessageTemplate
} from '../../src/utils/messageUtils.js';
import { getAdminDb } from '../firebaseAdmin.js';
import { createMessageProvider } from './providerFactory.js';

function formatDate(value) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  }).format(new Date(`${String(value).slice(0, 10)}T12:00:00Z`));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(Number(value) || 0);
}

export function buildMessageVariables({ gym, member, membership, plan, daysRemaining }) {
  return {
    memberName: member.fullName || member.firstName || 'Member',
    gymName: gym.name || gym.gymName || 'your gym',
    membershipPlan: plan?.name || 'current',
    expiryDate: formatDate(membership?.endDate),
    daysRemaining,
    amountDue: formatCurrency(Math.max((membership?.finalAmount || 0) - (membership?.amountPaid || 0), 0)),
    gymPhone: gym.phone || gym.mobile || '--'
  };
}

async function reserveAutomatedLog(logRef, payload, maxRetries) {
  const db = getAdminDb();
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(logRef);
    const current = snapshot.data();
    if ([MESSAGE_STATUS.SENT, MESSAGE_STATUS.DELIVERED].includes(current?.status)) {
      return { skip: true, reason: 'ALREADY_SENT' };
    }
    if (current?.status === MESSAGE_STATUS.QUEUED && current.lockExpiresAt?.toMillis() > Date.now()) {
      return { skip: true, reason: 'IN_PROGRESS' };
    }
    if ((current?.retryCount || 0) >= maxRetries) {
      return { skip: true, reason: 'MAX_RETRIES_REACHED' };
    }

    transaction.set(logRef, {
      ...payload,
      status: MESSAGE_STATUS.QUEUED,
      retryCount: current?.retryCount || 0,
      lockExpiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
      createdAt: current?.createdAt || FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    return { skip: false, retryCount: current?.retryCount || 0 };
  });
}

export async function processMessage({
  gymId,
  gym,
  member,
  membership,
  plan,
  template,
  campaignId = null,
  createdBy,
  settings,
  messageType = template.type,
  daysRemaining = null,
  automated = false,
  simulateStatus
}) {
  const db = getAdminDb();
  const phone = normalizeIndianPhone(member.mobile || member.phone);
  const idempotencyKey = automated
    ? createMessageIdempotencyKey(gymId, member.id, messageType, membership.endDate)
    : null;
  const logs = db.collection(`gyms/${gymId}/messageLogs`);
  const logRef = automated ? logs.doc(idempotencyKey) : logs.doc();
  const variables = buildMessageVariables({ gym, member, membership, plan, daysRemaining });
  const content = renderMessageTemplate(template.content, variables);
  const maxRetries = Math.max(1, Number(settings.maxRetries) || 2);
  const baseLog = {
    gymId,
    memberId: member.id,
    memberName: variables.memberName,
    phone: phone || String(member.mobile || member.phone || ''),
    channel: template.channel,
    templateId: template.id,
    campaignId,
    messageType,
    content,
    status: MESSAGE_STATUS.QUEUED,
    providerMessageId: null,
    sentAt: null,
    deliveredAt: null,
    failedAt: null,
    failureReason: null,
    idempotencyKey,
    createdBy
  };

  if (automated) {
    const reservation = await reserveAutomatedLog(logRef, baseLog, maxRetries);
    if (reservation.skip) return { skipped: true, reason: reservation.reason, messageId: logRef.id };
    baseLog.retryCount = reservation.retryCount;
  } else {
    await logRef.set({ ...baseLog, retryCount: 0, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  }

  if (!phone) {
    await logRef.update({
      status: MESSAGE_STATUS.FAILED,
      failureReason: 'Member does not have a valid Indian mobile number.',
      failedAt: FieldValue.serverTimestamp(),
      retryCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    });
    return { success: false, messageId: logRef.id, reason: 'INVALID_PHONE' };
  }

  const provider = createMessageProvider(settings.provider);
  const attemptLimit = automated ? Math.max(maxRetries - (baseLog.retryCount || 0), 1) : 1;
  let lastError;
  for (let attempt = 0; attempt < attemptLimit; attempt += 1) {
    try {
      const result = await provider.sendMessage({ phone, content, channel: template.channel, simulateStatus });
      const update = {
        status: result.status,
        providerMessageId: result.providerMessageId,
        sentAt: result.sentAt || FieldValue.serverTimestamp(),
        failureReason: null,
        failedAt: null,
        retryCount: FieldValue.increment(attempt + 1),
        lockExpiresAt: null,
        updatedAt: FieldValue.serverTimestamp()
      };
      if (result.status === MESSAGE_STATUS.DELIVERED) {
        update.deliveredAt = result.deliveredAt || FieldValue.serverTimestamp();
      }
      await logRef.update(update);
      return { success: true, messageId: logRef.id, status: result.status };
    } catch (error) {
      lastError = error;
    }
  }

  await logRef.update({
    status: MESSAGE_STATUS.FAILED,
    failureReason: lastError.message.slice(0, 300),
    failedAt: FieldValue.serverTimestamp(),
    retryCount: FieldValue.increment(attemptLimit),
    lockExpiresAt: null,
    updatedAt: FieldValue.serverTimestamp()
  });
  return { success: false, messageId: logRef.id, reason: lastError.code || 'PROVIDER_ERROR' };
}

export async function processInBatches(items, handler, batchSize = 10) {
  const results = [];
  const size = Math.max(1, Math.min(Number(batchSize) || 10, 25));
  for (let index = 0; index < items.length; index += size) {
    const batch = items.slice(index, index + size);
    results.push(...await Promise.all(batch.map(async (item) => {
      try {
        return await handler(item);
      } catch (error) {
        return { success: false, reason: error.message };
      }
    })));
  }
  return results;
}