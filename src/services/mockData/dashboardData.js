export const dashboardKpis = [
  {
    id: 'check-ins',
    label: "Today's Check-ins",
    value: 74,
    helper: '+8% vs yesterday',
    icon: 'pi pi-calendar-plus',
    tone: 'primary'
  },
  {
    id: 'active-members',
    label: 'Active Members',
    value: 312,
    helper: 'Across all plans',
    icon: 'pi pi-users',
    tone: 'success'
  },
  {
    id: 'expiring-soon',
    label: 'Expiring Soon',
    value: 12,
    helper: 'Next 7 days',
    icon: 'pi pi-exclamation-circle',
    tone: 'warning'
  },
  {
    id: 'monthly-collection',
    label: 'Monthly Collection',
    value: 84500,
    helper: 'Collected this month',
    icon: 'pi pi-wallet',
    tone: 'accent',
    format: 'currency'
  }
];

export const dashboardActions = [
  {
    id: 'expired-memberships',
    title: 'Memberships Expired',
    count: 8,
    detail: 'Needs immediate renewal follow-up',
    icon: 'pi pi-times-circle',
    tone: 'danger',
    route: '/memberships?status=EXPIRED'
  },
  {
    id: 'expiring-week',
    title: 'Expiring This Week',
    count: 12,
    detail: 'Contact members for proactive renewals',
    icon: 'pi pi-clock',
    tone: 'warning',
    route: '/memberships?status=EXPIRING%20SOON'
  },
  {
    id: 'pending-payments',
    title: 'Pending Payments',
    count: 7,
    detail: 'Partial or unpaid invoices pending',
    icon: 'pi pi-receipt',
    tone: 'accent',
    route: '/payments?status=PENDING'
  },
  {
    id: 'inactive-members',
    title: 'Inactive 10+ Days',
    count: 21,
    detail: 'Members may need engagement follow-up',
    icon: 'pi pi-user-minus',
    tone: 'neutral',
    route: '/members?status=INACTIVE'
  }
];

export const recentAttendance = [
  {
    id: 'ATT-1001',
    name: 'Rahul Patil',
    avatar: 'RP',
    checkInAt: '2026-07-27T06:08:00+05:30',
    membershipPlan: 'Quarterly Plan',
    expiryDate: '2026-09-19',
    status: 'ACTIVE'
  },
  {
    id: 'ATT-1002',
    name: 'Sneha More',
    avatar: 'SM',
    checkInAt: '2026-07-27T06:22:00+05:30',
    membershipPlan: 'Monthly Plan',
    expiryDate: '2026-08-01',
    status: 'EXPIRING SOON'
  },
  {
    id: 'ATT-1003',
    name: 'Amit Jadhav',
    avatar: 'AJ',
    checkInAt: '2026-07-27T06:35:00+05:30',
    membershipPlan: 'Annual Plan',
    expiryDate: '2027-01-10',
    status: 'ACTIVE'
  },
  {
    id: 'ATT-1004',
    name: 'Priya Deshmukh',
    avatar: 'PD',
    checkInAt: '2026-07-27T07:05:00+05:30',
    membershipPlan: 'Half Yearly Plan',
    expiryDate: '2026-07-24',
    status: 'EXPIRED'
  },
  {
    id: 'ATT-1005',
    name: 'Rohan Kulkarni',
    avatar: 'RK',
    checkInAt: '2026-07-27T07:18:00+05:30',
    membershipPlan: 'Monthly Plan',
    expiryDate: '2026-08-04',
    status: 'EXPIRING SOON'
  },
  {
    id: 'ATT-1006',
    name: 'Neha Joshi',
    avatar: 'NJ',
    checkInAt: '2026-07-27T07:41:00+05:30',
    membershipPlan: 'Quarterly Plan',
    expiryDate: '2026-10-11',
    status: 'ACTIVE'
  }
];