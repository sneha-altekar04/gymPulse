import { ATTENDANCE_SOURCE } from '../../constants/domain';

export const attendanceSeed = [
  {
    id: 'att-2001',
    memberId: 'member-001',
    checkInTime: '2026-07-27T06:08:00+05:30',
    checkOutTime: '2026-07-27T07:15:00+05:30',
    source: ATTENDANCE_SOURCE.FINGERPRINT,
    note: '',
    membershipStatus: 'ACTIVE',
    createdAt: '2026-07-27T06:08:02+05:30'
  },
  {
    id: 'att-2002',
    memberId: 'member-002',
    checkInTime: '2026-07-27T06:22:00+05:30',
    checkOutTime: null,
    source: ATTENDANCE_SOURCE.FINGERPRINT,
    note: '',
    membershipStatus: 'EXPIRING SOON',
    createdAt: '2026-07-27T06:22:04+05:30'
  },
  {
    id: 'att-2003',
    memberId: 'member-003',
    checkInTime: '2026-07-27T06:35:00+05:30',
    checkOutTime: null,
    source: ATTENDANCE_SOURCE.FINGERPRINT,
    note: 'Attempt with expired membership',
    membershipStatus: 'EXPIRED',
    createdAt: '2026-07-27T06:35:05+05:30'
  },
  {
    id: 'att-2004',
    memberId: 'member-005',
    checkInTime: '2026-07-27T07:18:00+05:30',
    checkOutTime: null,
    source: ATTENDANCE_SOURCE.FINGERPRINT,
    note: '',
    membershipStatus: 'EXPIRING SOON',
    createdAt: '2026-07-27T07:18:03+05:30'
  },
  {
    id: 'att-2005',
    memberId: 'member-006',
    checkInTime: '2026-07-27T07:41:00+05:30',
    checkOutTime: '2026-07-27T08:55:00+05:30',
    source: ATTENDANCE_SOURCE.MANUAL,
    note: 'Manual entry after device sync delay',
    membershipStatus: 'ACTIVE',
    createdAt: '2026-07-27T08:56:00+05:30'
  },
  {
    id: 'att-1961',
    memberId: 'member-001',
    checkInTime: '2026-07-26T06:11:00+05:30',
    checkOutTime: '2026-07-26T07:02:00+05:30',
    source: ATTENDANCE_SOURCE.FINGERPRINT,
    note: '',
    membershipStatus: 'ACTIVE',
    createdAt: '2026-07-26T06:11:02+05:30'
  },
  {
    id: 'att-1934',
    memberId: 'member-004',
    checkInTime: '2026-07-23T18:03:00+05:30',
    checkOutTime: '2026-07-23T19:01:00+05:30',
    source: ATTENDANCE_SOURCE.FINGERPRINT,
    note: '',
    membershipStatus: 'ACTIVE',
    createdAt: '2026-07-23T18:03:05+05:30'
  },
  {
    id: 'att-1888',
    memberId: 'member-008',
    checkInTime: '2026-07-20T20:10:00+05:30',
    checkOutTime: null,
    source: ATTENDANCE_SOURCE.MANUAL,
    note: 'Late check-in by receptionist',
    membershipStatus: 'ACTIVE',
    createdAt: '2026-07-20T20:15:00+05:30'
  }
];
