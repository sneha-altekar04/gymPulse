import { MESSAGE_TYPE } from '../../src/constants/domain.js';
import { differenceInCalendarDays, getExpiryNotificationType } from '../../src/utils/messageUtils.js';
import { requireCronSecret } from '../../server/auth.js';
import { getAdminDb } from '../../server/firebaseAdmin.js';
import { handleApiError, sendJson } from '../../server/http.js';
import { processInBatches, processMessage } from '../../server/messaging/messageEngine.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return sendJson(response, 405, { error: 'Method not allowed.' });
  try {
    requireCronSecret(request);
    const db = getAdminDb();
    const settingsSnapshot = await db.collectionGroup('messageSettings').where('enabled', '==', true).get();
    const summary = { gymsProcessed: 0, eligible: 0, sent: 0, failed: 0, skipped: 0 };

    for (const settingsDoc of settingsSnapshot.docs) {
      const settings = settingsDoc.data();
      const gymId = settings.gymId;
      if (!gymId) continue;
      summary.gymsProcessed += 1;
      const [gymSnapshot, membershipsSnapshot, templatesSnapshot, membersSnapshot, plansSnapshot] = await Promise.all([
        db.doc(`gyms/${gymId}`).get(),
        db.collection(`gyms/${gymId}/memberships`).get(),
        db.collection(`gyms/${gymId}/messageTemplates`).where('active', '==', true).get(),
        db.collection(`gyms/${gymId}/members`).get(),
        db.collection(`gyms/${gymId}/membershipPlans`).get()
      ]);
      const members = new Map(membersSnapshot.docs.map((item) => [item.id, { id: item.id, ...item.data() }]));
      const plans = new Map(plansSnapshot.docs.map((item) => [item.id, { id: item.id, ...item.data() }]));
      const templates = new Map(templatesSnapshot.docs.map((item) => [item.data().type, { id: item.id, ...item.data() }]));
      const latestByMember = new Map();
      membershipsSnapshot.docs.forEach((item) => {
        const membership = { id: item.id, ...item.data() };
        const current = latestByMember.get(membership.memberId);
        if (!current || String(membership.endDate) > String(current.endDate)) latestByMember.set(membership.memberId, membership);
      });

      const eligible = [];
      latestByMember.forEach((membership, memberId) => {
        const notificationType = getExpiryNotificationType(membership.endDate, settings.reminderDays, settings.sendOnExpiry);
        const template = templates.get(notificationType);
        const member = members.get(memberId);
        if (notificationType && template && member && member.status !== 'DELETED') {
          eligible.push({ member, membership, plan: plans.get(membership.planId), template, notificationType });
        }
      });
      summary.eligible += eligible.length;
      const results = await processInBatches(eligible, (item) => processMessage({
        gymId,
        gym: gymSnapshot.data() || {},
        member: item.member,
        membership: item.membership,
        plan: item.plan,
        template: item.template,
        createdBy: 'VERCEL_CRON',
        settings,
        messageType: item.notificationType,
        daysRemaining: differenceInCalendarDays(item.membership.endDate),
        automated: true
      }), settings.batchSize);
      summary.sent += results.filter((item) => item.success).length;
      summary.failed += results.filter((item) => item.success === false).length;
      summary.skipped += results.filter((item) => item.skipped).length;
    }

    return sendJson(response, 200, summary);
  } catch (error) {
    return handleApiError(response, error);
  }
}