const VALID_STATUSES = ['ACTIVE'];

/**
 * MembershipValidator - Decides whether to allow or deny attendance entry.
 */
class MembershipValidator {
  constructor(firebaseCache, logger) {
    this.cache = firebaseCache;
    this.logger = logger;
  }

  validate(deviceUserId) {
    const member = this.cache.getMemberByDeviceUserId(deviceUserId);

    if (!member) {
      return { decision: 'DENY', reason: 'Member Not Found', member: null };
    }

    const membership = this.cache.getActiveMembership(member.id);

    if (!membership) {
      return { decision: 'DENY', reason: 'No Active Membership', member };
    }

    const now = new Date();
    const endDate = new Date(membership.endDate);

    if (endDate < now) {
      return { decision: 'DENY', reason: 'Expired Membership', member };
    }

    if (membership.status === 'FROZEN') {
      return { decision: 'DENY', reason: 'Membership Frozen', member };
    }

    if (membership.status === 'CANCELLED') {
      return { decision: 'DENY', reason: 'Membership Cancelled', member };
    }

    if (!VALID_STATUSES.includes(membership.status)) {
      return { decision: 'DENY', reason: `Invalid status: ${membership.status}`, member };
    }

    return { decision: 'ALLOW', reason: null, member, membership };
  }
}

module.exports = { MembershipValidator };
