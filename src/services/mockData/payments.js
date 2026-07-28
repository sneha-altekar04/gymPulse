import { PAYMENT_METHOD, PAYMENT_STATUS } from '../../constants/domain';

export const paymentsSeed = [
  {
    id: 'pay-3001',
    receiptNumber: 'GYM-2026-000118',
    memberId: 'member-001',
    membershipId: 'ms-1001',
    amount: 3800,
    paymentMode: PAYMENT_METHOD.UPI,
    status: PAYMENT_STATUS.PAID,
    paymentDate: '2026-07-01',
    notes: ''
  },
  {
    id: 'pay-3002',
    receiptNumber: 'GYM-2026-000119',
    memberId: 'member-002',
    membershipId: 'ms-1002',
    amount: 1000,
    paymentMode: PAYMENT_METHOD.CASH,
    status: PAYMENT_STATUS.PARTIAL,
    paymentDate: '2026-07-03',
    notes: 'Remaining due at month-end'
  },
  {
    id: 'pay-3003',
    receiptNumber: 'GYM-2026-000120',
    memberId: 'member-006',
    membershipId: 'ms-1006',
    amount: 4000,
    paymentMode: PAYMENT_METHOD.CARD,
    status: PAYMENT_STATUS.PAID,
    paymentDate: '2026-07-14',
    notes: ''
  },
  {
    id: 'pay-3004',
    receiptNumber: 'GYM-2026-000121',
    memberId: 'member-005',
    membershipId: 'ms-1005',
    amount: 700,
    paymentMode: PAYMENT_METHOD.CASH,
    status: PAYMENT_STATUS.PARTIAL,
    paymentDate: '2026-07-06',
    notes: 'Pending reminder set'
  },
  {
    id: 'pay-3005',
    receiptNumber: 'GYM-2026-000122',
    memberId: 'member-010',
    membershipId: 'ms-1010',
    amount: 1500,
    paymentMode: PAYMENT_METHOD.BANK_TRANSFER,
    status: PAYMENT_STATUS.PAID,
    paymentDate: '2026-07-18',
    notes: ''
  },
  {
    id: 'pay-3006',
    receiptNumber: 'GYM-2026-000123',
    memberId: 'member-008',
    membershipId: 'ms-1008',
    amount: 5000,
    paymentMode: PAYMENT_METHOD.UPI,
    status: PAYMENT_STATUS.PARTIAL,
    paymentDate: '2026-03-05',
    notes: 'Balance carried forward'
  }
];
