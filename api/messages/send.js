import { FieldValue } from 'firebase-admin/firestore';
import { CAMPAIGN_STATUS } from '../../src/constants/domain.js';
import { requireMessagingUser } from '../../server/auth.js';
import { getAdminDb } from '../../server/firebaseAdmin.js';
import { handleApiError, sendJson } from '../../server/http.js';
import { processInBatches, processMessage } from '../../server/messaging/messageEngine.js';
import { resolveRecipients } from '../../server/messaging/recipientResolver.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed.' });

  try {
    const user = await requireMessagingUser(request);
    const { name, templateId, recipientType, memberIds = [], recipientFilter = {} } = request.body || {};
    if (!templateId || !recipientType) return sendJson(response, 400, { error: 'Template and recipients are required.' });

    const db = getAdminDb();
    const [templateSnapshot, settingsSnapshot, gymSnapshot] = await Promise.all([
      db.doc(`gyms/${user.gymId}/messageTemplates/${templateId}`).get(),
      db.doc(`gyms/${user.gymId}/messageSettings/configuration`).get(),
      db.doc(`gyms/${user.gymId}`).get()
    ]);
    const template = templateSnapshot.exists ? { id: templateSnapshot.id, ...templateSnapshot.data() } : null;
    if (!template?.active) return sendJson(response, 400, { error: 'The selected template is inactive or unavailable.' });

    const settings = { provider: 'MOCK', batchSize: 10, maxRetries: 2, ...settingsSnapshot.data() };
    const campaignRef = db.collection(`gyms/${user.gymId}/messageCampaigns`).doc();
    await campaignRef.set({
      gymId: user.gymId,
      name: name || template.name,
      channel: template.channel,
      templateId,
      recipientType,
      recipientFilter,
      status: CAMPAIGN_STATUS.PROCESSING,
      scheduledAt: null,
      recipientCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: user.uid
    });

    const recipients = await resolveRecipients(user.gymId, recipientType, memberIds);
    const results = await processInBatches(recipients, (recipient) => processMessage({
      gymId: user.gymId,
      gym: gymSnapshot.data() || {},
      ...recipient,
      template,
      campaignId: campaignRef.id,
      createdBy: user.uid,
      settings
    }), settings.batchSize);
    const failedCount = results.filter((result) => !result.success).length;
    const status = failedCount ? CAMPAIGN_STATUS.COMPLETED_WITH_ERRORS : CAMPAIGN_STATUS.COMPLETED;
    await campaignRef.update({
      status,
      recipientCount: recipients.length,
      sentCount: results.length - failedCount,
      failedCount,
      updatedAt: FieldValue.serverTimestamp()
    });

    return sendJson(response, 200, { campaignId: campaignRef.id, status, recipientCount: recipients.length, failedCount });
  } catch (error) {
    return handleApiError(response, error);
  }
}