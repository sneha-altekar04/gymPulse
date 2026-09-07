import { FieldValue } from 'firebase-admin/firestore';
import { MESSAGE_STATUS } from '../../src/constants/domain.js';
import { requireMessagingUser } from '../../server/auth.js';
import { getAdminDb } from '../../server/firebaseAdmin.js';
import { handleApiError, sendJson } from '../../server/http.js';
import { createMessageProvider } from '../../server/messaging/providerFactory.js';
import { normalizeIndianPhone } from '../../src/utils/messageUtils.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed.' });
  try {
    const user = await requireMessagingUser(request);
    const { messageId } = request.body || {};
    const db = getAdminDb();
    const logRef = db.doc(`gyms/${user.gymId}/messageLogs/${messageId}`);
    const [logSnapshot, settingsSnapshot] = await Promise.all([
      logRef.get(),
      db.doc(`gyms/${user.gymId}/messageSettings/configuration`).get()
    ]);
    const log = logSnapshot.data();
    const settings = { provider: 'MOCK', maxRetries: 2, ...settingsSnapshot.data() };
    if (!log || log.status !== MESSAGE_STATUS.FAILED) return sendJson(response, 400, { error: 'Only failed messages can be retried.' });
    if ((log.retryCount || 0) >= settings.maxRetries) return sendJson(response, 400, { error: 'Maximum retry count reached.' });
    const phone = normalizeIndianPhone(log.phone);
    if (!phone) return sendJson(response, 400, { error: 'The member phone number is invalid.' });

    try {
      const result = await createMessageProvider(settings.provider).sendMessage({ phone, content: log.content, channel: log.channel });
      await logRef.update({ status: result.status, providerMessageId: result.providerMessageId, sentAt: result.sentAt, failedAt: null, failureReason: null, retryCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
      return sendJson(response, 200, { messageId, status: result.status });
    } catch (error) {
      await logRef.update({ failureReason: error.message.slice(0, 300), failedAt: FieldValue.serverTimestamp(), retryCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
      return sendJson(response, 502, { error: 'The message failed again.' });
    }
  } catch (error) {
    return handleApiError(response, error);
  }
}