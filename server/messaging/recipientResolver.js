import { MEMBER_STATUS, RECIPIENT_TYPE } from '../../src/constants/domain.js';
import { differenceInCalendarDays } from '../../src/utils/messageUtils.js';
import { getAdminDb } from '../firebaseAdmin.js';

export async function resolveRecipients(gymId, recipientType, memberIds = []) {
  const db = getAdminDb();
  const [membersSnapshot, membershipsSnapshot, plansSnapshot] = await Promise.all([
    db.collection(`gyms/${gymId}/members`).get(),
    db.collection(`gyms/${gymId}/memberships`).get(),
    db.collection(`gyms/${gymId}/membershipPlans`).get()
  ]);
  const membershipsByMember = new Map();
  membershipsSnapshot.docs.forEach((snapshot) => {
    const membership = { id: snapshot.id, ...snapshot.data() };
    const current = membershipsByMember.get(membership.memberId);
    if (!current || String(membership.endDate) > String(current.endDate)) membershipsByMember.set(membership.memberId, membership);
  });
  const plans = new Map(plansSnapshot.docs.map((snapshot) => [snapshot.id, { id: snapshot.id, ...snapshot.data() }]));

  const recipients = membersSnapshot.docs
    .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
    .filter((member) => member.status !== 'DELETED')
    .map((member) => {
      const membership = membershipsByMember.get(member.id) || null;
      const daysRemaining = membership?.endDate ? differenceInCalendarDays(membership.endDate) : null;
      return { member, membership, plan: membership ? plans.get(membership.planId) || null : null, daysRemaining };
  });

  return filterRecipients(recipients, recipientType, memberIds);
}

export function filterRecipients(recipients, recipientType, memberIds = []) {
  const requestedIds = new Set(memberIds);
  return recipients.filter(({ member, membership, daysRemaining }) => {
    if ([RECIPIENT_TYPE.SINGLE_MEMBER, RECIPIENT_TYPE.SELECTED_MEMBERS].includes(recipientType)) return requestedIds.has(member.id);
    if (recipientType === RECIPIENT_TYPE.ALL_MEMBERS) return true;
    if (recipientType === RECIPIENT_TYPE.ALL_ACTIVE) return membership && daysRemaining >= 0 && member.status !== MEMBER_STATUS.INACTIVE;
    if (recipientType === RECIPIENT_TYPE.EXPIRING_SOON) return membership && daysRemaining >= 0 && daysRemaining <= 7;
    if (recipientType === RECIPIENT_TYPE.EXPIRED) return membership && daysRemaining < 0;
    if (recipientType === RECIPIENT_TYPE.PENDING_PAYMENT) {
      return membership && Number(membership.finalAmount || 0) > Number(membership.amountPaid || 0);
    }
    return false;
  });
}