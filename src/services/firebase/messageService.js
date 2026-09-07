import { auth } from '../../firebase/firebase';
import { db } from '../../firebase/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { addDocument, getDocument, queryDocuments, updateDocument } from '../../firebase/firestore';
import { DEFAULT_REMINDER_DAYS, MESSAGE_CHANNEL } from '../../constants/domain';

const settingsPath = (gymId) => `gyms/${gymId}/messageSettings`;

export const DEFAULT_MESSAGE_SETTINGS = {
  gymId: '',
  provider: 'MOCK',
  channel: MESSAGE_CHANNEL.WHATSAPP,
  enabled: true,
  reminderDays: DEFAULT_REMINDER_DAYS,
  sendOnExpiry: false,
  paymentReminders: true,
  defaultSender: '',
  batchSize: 10,
  maxRetries: 2
};

export async function getMessageTemplates(gymId, activeOnly = false) {
  const conditions = activeOnly ? [['active', '==', true]] : [];
  return queryDocuments(`gyms/${gymId}/messageTemplates`, conditions, {
    orderByField: 'name',
    orderDirection: 'asc'
  });
}

export async function createMessageTemplate(gymId, template, createdBy) {
  return addDocument(`gyms/${gymId}/messageTemplates`, {
    ...template,
    gymId,
    createdBy
  });
}

export async function updateMessageTemplate(gymId, templateId, template) {
  return updateDocument(`gyms/${gymId}/messageTemplates`, templateId, template);
}

export async function getMessageSettings(gymId) {
  const settings = await getDocument(settingsPath(gymId), 'configuration');
  return { ...DEFAULT_MESSAGE_SETTINGS, gymId, ...settings };
}

export async function saveMessageSettings(gymId, settings, createdBy) {
  const current = await getDocument(settingsPath(gymId), 'configuration');
  const payload = {
    ...DEFAULT_MESSAGE_SETTINGS,
    ...settings,
    gymId,
    createdBy: current?.createdBy || createdBy
  };

  if (current) {
    return updateDocument(settingsPath(gymId), 'configuration', payload);
  }

  return setDoc(doc(db, settingsPath(gymId), 'configuration'), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function getMessageLogs(gymId, filters = {}) {
  const conditions = [];
  if (filters.memberId) conditions.push(['memberId', '==', filters.memberId]);
  if (filters.status) conditions.push(['status', '==', filters.status]);
  if (filters.channel) conditions.push(['channel', '==', filters.channel]);
  if (filters.messageType) conditions.push(['messageType', '==', filters.messageType]);

  return queryDocuments(`gyms/${gymId}/messageLogs`, conditions, {
    orderByField: 'createdAt',
    orderDirection: 'desc',
    limitCount: filters.limit || 200
  });
}

export async function getMessageCampaigns(gymId) {
  return queryDocuments(`gyms/${gymId}/messageCampaigns`, [], {
    orderByField: 'createdAt',
    orderDirection: 'desc',
    limitCount: 50
  });
}

async function authorizedRequest(url, options = {}) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be logged in to send messages.');
  const token = await currentUser.getIdToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Unable to process messages.');
  return result;
}

export function sendMessageCampaign(payload) {
  return authorizedRequest('/api/messages/send', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function retryFailedMessage(messageId) {
  return authorizedRequest('/api/messages/retry', {
    method: 'POST',
    body: JSON.stringify({ messageId })
  });
}