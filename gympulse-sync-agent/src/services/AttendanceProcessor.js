const { MembershipValidator } = require('./MembershipValidator');
const db = require('../storage/database');

/**
 * AttendanceProcessor - Validates membership and queues attendance for upload.
 */
class AttendanceProcessor {
  constructor(firebaseCache, logger) {
    this.validator = new MembershipValidator(firebaseCache, logger);
    this.logger = logger;
  }

  process(event) {
    const { userId, timestamp, type } = event;

    // Deduplication: check if same user checked in within last 5 minutes
    if (this._isDuplicate(userId, timestamp)) {
      this.logger.info('AttendanceProcessor: Duplicate ignored', { userId });
      return;
    }

    const result = this.validator.validate(userId);

    if (result.decision === 'ALLOW') {
      const record = {
        memberId: result.member.id,
        deviceUserId: userId,
        checkInTime: timestamp,
        source: 'FINGERPRINT',
        membershipStatus: result.membership.status,
        syncStatus: 'PENDING',
        createdAt: new Date().toISOString()
      };

      db.queueAttendance(record);
      db.addLog('info', `Attendance accepted: ${result.member.fullName || userId}`);
      this.logger.info('AttendanceProcessor: Accepted', { userId, memberId: result.member.id });
    } else {
      db.logRejection({
        deviceUserId: userId,
        memberName: result.member?.fullName || 'Unknown',
        reason: result.reason,
        timestamp,
        createdAt: new Date().toISOString()
      });
      db.addLog('warn', `Attendance DENIED for ${userId}: ${result.reason}`);
      this.logger.warn('AttendanceProcessor: Denied', { userId, reason: result.reason });
    }
  }

  _isDuplicate(userId, timestamp) {
    const fiveMinutesAgo = new Date(new Date(timestamp).getTime() - 5 * 60 * 1000).toISOString();
    return db.hasRecentAttendance(userId, fiveMinutesAgo);
  }
}

module.exports = { AttendanceProcessor };
