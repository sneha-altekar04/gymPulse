import { REPORT_DEFINITIONS, REPORT_TYPE } from '../../constants/reporting.js';
import {
  classifyActivity,
  collectedPayments,
  deduplicateAttendance,
  filterByDate,
  getRenewalMemberships,
  percentageChange,
  sumCollection
} from '../reportCalculations.js';
import { daysInRange, isDateInRange, previousPeriod, toBusinessDateKey } from '../../utils/reportDateUtils.js';

const COLORS = {
  revenue: '#16a36a', attendance: '#0f8da8', membership: '#f59e42', members: '#7157d9',
  trainers: '#ef6a67', growth: '#4f6ef7', warning: '#e58a21', critical: '#e24d65', neutral: '#7a8499'
};

function column(key, label, format = 'text') {
  return { key, label, format, sortable: true };
}

function stat(label, value, icon, accent, options = {}) {
  return { label, value, icon, accent, format: options.format || 'number', subtitle: options.subtitle || '', comparison: options.comparison ?? null, inverse: options.inverse || false };
}

function chart(title, type, labels, datasets, emptyMessage = 'Not enough data for this chart.') {
  return { title, type, labels, datasets, emptyMessage };
}

function group(records, keyFn, valueFn = () => 1) {
  const result = new Map();
  records.forEach((record) => {
    const key = keyFn(record);
    result.set(key, (result.get(key) || 0) + Number(valueFn(record) || 0));
  });
  return result;
}

function trendChart(title, records, dateField, valueFn, color, label) {
  const grouped = group(records, (item) => String(item[dateField]).slice(0, 10), valueFn);
  const labels = [...grouped.keys()].sort();
  return chart(title, 'line', labels, [{ label, data: labels.map((key) => grouped.get(key)), borderColor: color, backgroundColor: `${color}22`, fill: true, tension: 0.28 }]);
}

function getLatestMemberships(memberships) {
  const latest = new Map();
  memberships.forEach((membership) => {
    const current = latest.get(membership.memberId);
    if (!current || String(membership.endDate) > String(current.endDate)) latest.set(membership.memberId, membership);
  });
  return latest;
}

function applyFilters(source, config) {
  const filters = config.filters || {};
  const membersById = new Map(source.members.map((member) => [member.id, member]));
  const membershipsById = new Map(source.memberships.map((membership) => [membership.id, membership]));
  const trainerScope = config.role === 'TRAINER' ? (config.trainerId || '__UNASSIGNED_TRAINER__') : filters.trainerId;
  const memberAllowed = (memberId) => {
    const member = membersById.get(memberId);
    if (!member) return false;
    if (filters.memberId && member.id !== filters.memberId) return false;
    if (trainerScope && member.trainerId !== trainerScope) return false;
    if (filters.membershipStatus && member.membershipStatus !== filters.membershipStatus) return false;
    if (filters.planId && member.latestMembership?.planId !== filters.planId) return false;
    return true;
  };

  return {
    ...source,
    members: source.members.filter((member) => memberAllowed(member.id)),
    memberships: source.memberships.filter((item) => memberAllowed(item.memberId) && (!filters.planId || item.planId === filters.planId)),
    attendance: source.attendance.filter((item) => memberAllowed(item.memberId) && (!filters.attendanceSource || item.source === filters.attendanceSource)),
    payments: source.payments.filter((item) => {
      const membership = membershipsById.get(item.membershipId);
      return memberAllowed(item.memberId) && (!filters.planId || membership?.planId === filters.planId) &&
        (!filters.paymentStatus || item.status === filters.paymentStatus) && (!filters.paymentMode || item.paymentMode === filters.paymentMode);
    }),
    membersById
  };
}

function baseData(source, config) {
  const scoped = applyFilters(source, config);
  const attendance = deduplicateAttendance(filterByDate(scoped.attendance, 'checkInTime', config.range));
  const payments = collectedPayments(scoped.payments, config.range);
  const memberships = filterByDate(scoped.memberships, 'startDate', config.range);
  const newMembers = filterByDate(scoped.members, 'joiningDate', config.range);
  return { ...scoped, attendance, payments, memberships, newMembers };
}

function compare(value, source, config, selector) {
  if (!config.compare) return null;
  const priorConfig = { ...config, range: previousPeriod(config.range), compare: false };
  return percentageChange(value, selector(baseData(source, priorConfig)));
}

export function getGymOverview(source, config) {
  const data = baseData(source, config);
  const renewals = getRenewalMemberships(data.memberships.length ? source.memberships : [], config.range);
  const collection = sumCollection(data.payments, config.range);
  const active = data.members.filter((member) => ['ACTIVE', 'EXPIRING SOON'].includes(member.membershipStatus));
  const expired = data.members.filter((member) => member.membershipStatus === 'EXPIRED');
  const outstanding = data.members.reduce((sum, member) => sum + Number(member.outstandingBalance || 0), 0);
  const currentVisits = data.attendance.length;
  const kpis = [
    stat('Total Members', data.members.length, 'pi pi-users', 'members'),
    stat('Active Members', active.length, 'pi pi-user-plus', 'growth'),
    stat('New Members', data.newMembers.length, 'pi pi-sparkles', 'members', { comparison: compare(data.newMembers.length, source, config, (prior) => prior.newMembers.length) }),
    stat('Renewals', renewals.length, 'pi pi-refresh', 'membership'),
    stat('Expired Memberships', expired.length, 'pi pi-exclamation-circle', 'critical', { inverse: true }),
    stat('Attendance', currentVisits, 'pi pi-calendar', 'attendance', { subtitle: 'visits', comparison: compare(currentVisits, source, config, (prior) => prior.attendance.length) }),
    stat('Collection', collection, 'pi pi-wallet', 'revenue', { format: 'currency', comparison: compare(collection, source, config, (prior) => prior.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)) }),
    stat('Outstanding', outstanding, 'pi pi-credit-card', 'warning', { format: 'currency', inverse: true })
  ];
  const rows = data.members.map((member) => ({ member: member.fullName, membership: member.membershipPlanName, status: member.membershipStatus, visits: data.attendance.filter((item) => item.memberId === member.id).length, outstanding: member.outstandingBalance, expiry: member.membershipExpiryDate }));
  return {
    title: 'Gym Overview', subtitle: 'A concise health check across members, attendance, and collections.', kpis,
    charts: [
      trendChart('Member Growth Trend', data.newMembers, 'joiningDate', () => 1, COLORS.members, 'New members'),
      trendChart('Attendance Trend', data.attendance, 'checkInTime', () => 1, COLORS.attendance, 'Visits'),
      trendChart('Revenue Trend', data.payments, 'paymentDate', (item) => item.amount, COLORS.revenue, 'Collection')
    ],
    columns: [column('member', 'Member'), column('membership', 'Membership'), column('status', 'Status', 'status'), column('visits', 'Visits', 'number'), column('outstanding', 'Outstanding', 'currency'), column('expiry', 'Expiry', 'date')], rows
  };
}

export function getRevenueReport(source, config) {
  const data = baseData(source, config);
  const total = data.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const personalTrainingRevenue = data.payments.reduce((sum, item) => sum + Number(item.personalTrainingAmount || 0), 0);
  const membershipRevenue = data.payments.reduce((sum, item) => sum + Number(item.membershipAmount ?? item.amount ?? 0), 0);
  const byMethod = group(data.payments, (item) => item.paymentMode, (item) => item.amount);
  const byPlan = group(data.payments, (item) => item.membershipPlanName || 'Membership', (item) => item.amount);
  const outstanding = data.members.reduce((sum, member) => sum + Number(member.outstandingBalance || 0), 0);
  return {
    title: 'Revenue & Collections', subtitle: 'Actual successful payment records for the selected period.',
    kpis: [stat('Membership Revenue', membershipRevenue, 'pi pi-id-card', 'membership', { format: 'currency' }), stat('Personal Training Revenue', personalTrainingRevenue, 'pi pi-bolt', 'trainers', { format: 'currency' }), stat('Total Revenue', total, 'pi pi-wallet', 'revenue', { format: 'currency', comparison: compare(total, source, config, (prior) => prior.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)) }), stat('Outstanding Amount', outstanding, 'pi pi-exclamation-circle', 'warning', { format: 'currency', inverse: true }), stat('Number of Payments', data.payments.length, 'pi pi-receipt', 'attendance')],
    charts: [trendChart('Revenue Trend', data.payments, 'paymentDate', (item) => item.amount, COLORS.revenue, 'Collection'), chart('Collection by Payment Method', 'doughnut', [...byMethod.keys()], [{ data: [...byMethod.values()], backgroundColor: [COLORS.revenue, COLORS.attendance, COLORS.members, COLORS.membership] }]), chart('Collection by Membership Plan', 'bar', [...byPlan.keys()], [{ label: 'Collection', data: [...byPlan.values()], backgroundColor: COLORS.membership }])],
    columns: [column('paymentDate', 'Date', 'date'), column('receiptNumber', 'Receipt Number'), column('memberName', 'Member'), column('membershipPlanName', 'Membership'), column('membershipAmount', 'Membership Revenue', 'currency'), column('personalTrainingAmount', 'PT Revenue', 'currency'), column('amount', 'Total Paid', 'currency'), column('paymentMode', 'Payment Mode'), column('status', 'Status', 'status')], rows: data.payments
  };
}

export function getMembershipReport(source, config) {
  const data = baseData(source, config);
  const renewals = getRenewalMemberships(source.memberships, config.range);
  const latest = [...getLatestMemberships(data.memberships.length ? source.memberships : []).values()];
  const distribution = group(latest, (item) => item.planName || 'Unknown Plan');
  const active = latest.filter((item) => item.daysRemaining >= 0);
  const expired = latest.filter((item) => item.daysRemaining < 0);
  return { title: 'Membership Performance', subtitle: 'Membership sales, renewals, expiry, and plan distribution.', kpis: [stat('Active Memberships', active.length, 'pi pi-check-circle', 'growth'), stat('New Memberships', data.memberships.length - renewals.length, 'pi pi-plus-circle', 'members'), stat('Renewals', renewals.length, 'pi pi-refresh', 'membership'), stat('Expired', expired.length, 'pi pi-times-circle', 'critical', { inverse: true }), stat('Expiring Soon', latest.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 7).length, 'pi pi-clock', 'warning', { inverse: true })], charts: [chart('Membership Plan Distribution', 'doughnut', [...distribution.keys()], [{ data: [...distribution.values()], backgroundColor: [COLORS.members, COLORS.attendance, COLORS.membership, COLORS.revenue] }]), trendChart('New vs Renewals Trend', data.memberships, 'startDate', () => 1, COLORS.membership, 'Memberships')], columns: [column('memberName', 'Member'), column('planName', 'Plan'), column('startDate', 'Start Date', 'date'), column('endDate', 'End Date', 'date'), column('finalAmount', 'Amount', 'currency'), column('status', 'Status', 'status')], rows: data.memberships };
}

export function getMemberGrowthReport(source, config) {
  const data = baseData(source, config);
  const renewals = getRenewalMemberships(source.memberships, config.range);
  const opening = data.members.filter((member) => member.joiningDate < config.range.startDate).length;
  const expired = data.members.filter((member) => member.membershipStatus === 'EXPIRED').length;
  const cancelled = data.memberships.filter((item) => item.status === 'CANCELLED').length;
  return { title: 'Member Growth', subtitle: 'Opening membership base, joins, renewals, and closing position.', kpis: [stat('Opening Members', opening, 'pi pi-users', 'neutral'), stat('New Members', data.newMembers.length, 'pi pi-user-plus', 'members'), stat('Renewals', renewals.length, 'pi pi-refresh', 'membership'), stat('Expired', expired, 'pi pi-user-minus', 'critical', { inverse: true }), stat('Cancelled', cancelled, 'pi pi-ban', 'warning', { inverse: true }), stat('Closing Members', opening + data.newMembers.length - cancelled, 'pi pi-flag', 'growth')], charts: [trendChart('Member Growth Trend', data.newMembers, 'joiningDate', () => 1, COLORS.growth, 'New members'), trendChart('Renewals Trend', renewals, 'startDate', () => 1, COLORS.membership, 'Renewals')], columns: [column('fullName', 'Member'), column('joiningDate', 'Joining Date', 'date'), column('membershipPlanName', 'Membership'), column('trainerName', 'Trainer'), column('membershipStatus', 'Status', 'status')], rows: data.newMembers };
}

function memberActivityRows(source, config) {
  const data = baseData(source, config);
  return data.members.map((member) => {
    const visits = data.attendance.filter((entry) => entry.memberId === member.id);
    const lastVisit = visits.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))[0]?.checkInTime || member.lastVisitAt;
    return { id: member.id, member: member.fullName, memberCode: member.memberCode, visits: visits.length, lastVisit, averageVisits: visits.length / Math.max(daysInRange(config.range) / 7, 1), membership: member.membershipPlanName, expiry: member.membershipExpiryDate, activity: classifyActivity(visits.length, lastVisit, config.range), trainer: member.trainerName };
  }).filter((row) => !config.filters?.activityLevel || row.activity === config.filters.activityLevel).sort((a, b) => b.visits - a.visits);
}

export function getMemberActivityReport(source, config) {
  const rows = memberActivityRows(source, config);
  const activity = group(rows, (item) => item.activity);
  return { title: 'Member Activity', subtitle: 'Identify engaged, low-activity, inactive, and declining members.', kpis: [stat('Most Active Visits', rows[0]?.visits || 0, 'pi pi-star', 'members'), stat('Highly Active', activity.get('HIGHLY ACTIVE') || 0, 'pi pi-bolt', 'growth'), stat('Low Activity', activity.get('LOW ACTIVITY') || 0, 'pi pi-angle-down', 'warning', { inverse: true }), stat('Inactive Members', activity.get('INACTIVE') || 0, 'pi pi-user-minus', 'critical', { inverse: true })], charts: [chart('Member Activity Distribution', 'doughnut', [...activity.keys()], [{ data: [...activity.values()], backgroundColor: [COLORS.growth, COLORS.attendance, COLORS.warning, COLORS.critical] }]), chart('Most Active Members', 'bar', rows.slice(0, 10).map((item) => item.member), [{ label: 'Visits', data: rows.slice(0, 10).map((item) => item.visits), backgroundColor: COLORS.members }])], columns: [column('member', 'Member'), column('visits', 'Visits', 'number'), column('lastVisit', 'Last Visit', 'dateTime'), column('averageVisits', 'Average Visits/Week', 'decimal'), column('membership', 'Current Membership'), column('expiry', 'Expiry', 'date'), column('activity', 'Activity Status', 'status')], rows };
}

export function getMemberAttendanceReport(source, config) {
  const data = baseData(source, config);
  const member = data.members.find((item) => item.id === config.filters?.memberId);
  const rows = member ? data.attendance.filter((item) => item.memberId === member.id) : data.attendance;
  const dayGroups = group(rows, (item) => String(item.checkInTime).slice(0, 10));
  return { title: 'Member Attendance', subtitle: member ? `${member.fullName}'s attendance and current membership.` : 'Select a member to inspect individual attendance patterns.', profile: member || null, kpis: [stat('Total Visits', rows.length, 'pi pi-calendar', 'attendance'), stat('Visits This Month', member?.visitsThisMonth || rows.length, 'pi pi-calendar-plus', 'growth'), stat('Average Visits/Week', rows.length / Math.max(daysInRange(config.range) / 7, 1), 'pi pi-chart-line', 'members', { format: 'decimal' }), stat('Active Days', dayGroups.size, 'pi pi-clock', 'membership')], charts: [trendChart('Attendance Trend', rows, 'checkInTime', () => 1, COLORS.attendance, 'Visits')], columns: [column('checkInTime', 'Date', 'date'), column('checkInTime', 'Check-in', 'time'), column('checkOutTime', 'Check-out', 'time'), column('duration', 'Duration'), column('source', 'Source', 'status')], rows: rows.map((item) => ({ ...item, duration: item.checkOutTime ? `${Math.max(Math.round((new Date(item.checkOutTime) - new Date(item.checkInTime)) / 60000), 0)} min` : '--' })) };
}

export function getExpiryReport(source, config) {
  const data = applyFilters(source, config);
  const rows = data.members.filter((member) => member.membershipExpiryDate).map((member) => ({ id: member.id, member: member.fullName, phone: member.mobile, plan: member.membershipPlanName, expiryDate: member.membershipExpiryDate, daysRemaining: member.latestMembership?.endDate ? Math.floor((Date.parse(`${String(member.latestMembership.endDate).slice(0, 10)}T00:00:00Z`) - Date.parse(`${toBusinessDateKey()}T00:00:00Z`)) / 86400000) : null, trainer: member.trainerName, outstanding: member.outstandingBalance, status: member.membershipStatus })).sort((a, b) => (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity));
  return { title: 'Membership Expiry', subtitle: 'Urgent renewals and upcoming expiry windows, sorted by priority.', kpis: [stat('Expired', rows.filter((item) => item.daysRemaining < 0).length, 'pi pi-times-circle', 'critical', { inverse: true }), stat('Expiring in 7 Days', rows.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 7).length, 'pi pi-clock', 'warning', { inverse: true }), stat('Expiring in 30 Days', rows.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 30).length, 'pi pi-calendar', 'membership', { inverse: true }), stat('Expiring in 60 Days', rows.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 60).length, 'pi pi-calendar-plus', 'members')], charts: [], columns: [column('member', 'Member'), column('phone', 'Phone'), column('plan', 'Plan'), column('expiryDate', 'Expiry Date', 'date'), column('daysRemaining', 'Days Remaining', 'number'), column('trainer', 'Trainer'), column('outstanding', 'Outstanding', 'currency'), column('status', 'Status', 'status')], rows, actions: 'MEMBERSHIP' };
}

export function getOutstandingReport(source, config) {
  const data = applyFilters(source, config);
  const rows = data.members.filter((member) => member.outstandingBalance > 0).map((member) => { const membership = member.latestMembership || {}; const memberPayments = data.payments.filter((item) => item.memberId === member.id).sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)); const daysRemaining = membership.endDate ? Math.floor((Date.parse(`${String(membership.endDate).slice(0, 10)}T00:00:00Z`) - Date.parse(`${toBusinessDateKey()}T00:00:00Z`)) / 86400000) : 0; return { id: member.id, member: member.fullName, membership: member.membershipPlanName, totalAmount: membership.finalAmount ?? 0, paid: membership.amountPaid ?? 0, outstanding: member.outstandingBalance, lastPayment: memberPayments[0]?.paymentDate, daysOutstanding: Math.max(-daysRemaining, 0) }; }).sort((a, b) => b.outstanding - a.outstanding);
  const total = rows.reduce((sum, item) => sum + item.outstanding, 0);
  return { title: 'Outstanding Payments', subtitle: 'Members with dues, sorted by highest outstanding amount.', kpis: [stat('Total Outstanding', total, 'pi pi-wallet', 'critical', { format: 'currency', inverse: true }), stat('Members With Dues', rows.length, 'pi pi-users', 'warning', { inverse: true }), stat('Average Outstanding', total / Math.max(rows.length, 1), 'pi pi-calculator', 'membership', { format: 'currency', inverse: true })], charts: [chart('Highest Outstanding', 'bar', rows.slice(0, 10).map((item) => item.member), [{ label: 'Outstanding', data: rows.slice(0, 10).map((item) => item.outstanding), backgroundColor: COLORS.critical }])], columns: [column('member', 'Member'), column('membership', 'Membership'), column('totalAmount', 'Total Amount', 'currency'), column('paid', 'Paid', 'currency'), column('outstanding', 'Outstanding', 'currency'), column('lastPayment', 'Last Payment', 'date'), column('daysOutstanding', 'Days Outstanding', 'number')], rows, actions: 'PAYMENT' };
}

export function getAttendanceReport(source, config, mode = 'OVERVIEW') {
  const data = baseData(source, config);
  const byDay = group(data.attendance, (item) => String(item.checkInTime).slice(0, 10));
  const byHour = group(data.attendance, (item) => new Date(item.checkInTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }));
  const peakDay = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
  const peakHour = [...byHour.entries()].sort((a, b) => b[1] - a[1])[0];
  const rows = [...byDay.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([date, visits]) => ({ date, visits, uniqueMembers: new Set(data.attendance.filter((item) => String(item.checkInTime).slice(0, 10) === date).map((item) => item.memberId)).size, averageDuration: '--' }));
  if (mode === 'PEAK') return { title: 'Peak Hours', subtitle: 'Attendance distribution that informs staffing and trainer schedules.', kpis: [stat('Peak Hour', peakHour ? `${peakHour[0]}:00` : '--', 'pi pi-clock', 'attendance', { format: 'text' }), stat('Peak Day', peakDay?.[0] || '--', 'pi pi-calendar', 'members', { format: 'date' }), stat('Morning Visits', data.attendance.filter((item) => Number(new Date(item.checkInTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false })) < 12).length, 'pi pi-sun', 'membership'), stat('Evening Visits', data.attendance.filter((item) => Number(new Date(item.checkInTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false })) >= 17).length, 'pi pi-moon', 'growth')], charts: [chart('Attendance by Hour', 'bar', [...byHour.keys()].sort(), [{ label: 'Visits', data: [...byHour.keys()].sort().map((key) => byHour.get(key)), backgroundColor: COLORS.attendance }])], columns: [column('date', 'Date', 'date'), column('visits', 'Visits', 'number'), column('uniqueMembers', 'Unique Members', 'number'), column('averageDuration', 'Average Duration')], rows };
  return { title: mode === 'DAILY' ? 'Daily Attendance' : mode === 'TRENDS' ? 'Attendance Trends' : 'Attendance Overview', subtitle: 'Unique, deduplicated visits across the selected business period.', kpis: [stat('Total Visits', data.attendance.length, 'pi pi-calendar', 'attendance', { comparison: compare(data.attendance.length, source, config, (prior) => prior.attendance.length) }), stat('Average Daily Visits', data.attendance.length / daysInRange(config.range), 'pi pi-chart-line', 'growth', { format: 'decimal' }), stat('Unique Members', new Set(data.attendance.map((item) => item.memberId)).size, 'pi pi-users', 'members'), stat('Peak Day', peakDay?.[0] || '--', 'pi pi-star', 'membership', { format: 'date' }), stat('Peak Hour', peakHour ? `${peakHour[0]}:00` : '--', 'pi pi-clock', 'attendance', { format: 'text' })], charts: [trendChart('Daily Attendance Trend', data.attendance, 'checkInTime', () => 1, COLORS.attendance, 'Visits')], columns: [column('date', 'Date', 'date'), column('visits', 'Visits', 'number'), column('uniqueMembers', 'Unique Members', 'number'), column('averageDuration', 'Average Duration')], rows };
}

export function getTrainerReport(source, config, memberMode = false) {
  const data = applyFilters(source, config);
  const activityRows = memberActivityRows(source, config);
  if (memberMode && config.filters?.trainerId) return { ...getMemberActivityReport(source, config), title: 'Trainer Member Activity', subtitle: 'Assigned members who need engagement or renewal attention.' };
  const rows = data.trainers.filter((trainer) => !config.filters?.trainerId || trainer.id === config.filters.trainerId).map((trainer) => { const members = data.members.filter((member) => member.trainerId === trainer.id); const ids = new Set(members.map((member) => member.id)); const visits = data.attendance.filter((item) => ids.has(item.memberId)).length; return { trainer: trainer.fullName, members: members.length, active: members.filter((item) => ['ACTIVE', 'EXPIRING SOON'].includes(item.membershipStatus)).length, averageAttendance: visits / Math.max(members.length, 1), renewals: getRenewalMemberships(data.memberships.filter((item) => ids.has(item.memberId)), config.range).length, inactive: activityRows.filter((item) => ids.has(item.id) && item.activity === 'INACTIVE').length }; });
  return { title: memberMode ? 'Trainer Member Activity' : 'Trainer Performance', subtitle: 'Meaningful trainer comparisons based on assigned-member outcomes.', kpis: [stat('Trainers', rows.length, 'pi pi-briefcase', 'trainers'), stat('Assigned Members', rows.reduce((sum, item) => sum + item.members, 0), 'pi pi-users', 'members'), stat('Active Members', rows.reduce((sum, item) => sum + item.active, 0), 'pi pi-check-circle', 'growth'), stat('Inactive Members', rows.reduce((sum, item) => sum + item.inactive, 0), 'pi pi-user-minus', 'critical', { inverse: true })], charts: [chart('Trainer Member Comparison', 'bar', rows.map((item) => item.trainer), [{ label: 'Active', data: rows.map((item) => item.active), backgroundColor: COLORS.trainers }, { label: 'Inactive', data: rows.map((item) => item.inactive), backgroundColor: COLORS.critical }])], columns: [column('trainer', 'Trainer'), column('members', 'Members', 'number'), column('active', 'Active', 'number'), column('averageAttendance', 'Avg Attendance', 'decimal'), column('renewals', 'Renewals', 'number'), column('inactive', 'Inactive', 'number')], rows };
}

export function getPlanPerformanceReport(source, config) {
  const data = baseData(source, config);
  const renewals = getRenewalMemberships(source.memberships, config.range);
  const membershipsById = new Map(source.memberships.map((item) => [item.id, item]));
  const rows = data.plans.filter((plan) => !config.filters?.planId || plan.id === config.filters.planId).map((plan) => { const memberships = data.memberships.filter((item) => item.planId === plan.id); const memberIds = new Set(memberships.map((item) => item.memberId)); const revenue = data.payments.filter((item) => membershipsById.get(item.membershipId)?.planId === plan.id).reduce((sum, item) => sum + Number(item.amount || 0), 0); const active = source.members.filter((member) => member.latestMembership?.planId === plan.id && ['ACTIVE', 'EXPIRING SOON'].includes(member.membershipStatus)).length; const expired = source.members.filter((member) => member.latestMembership?.planId === plan.id && member.membershipStatus === 'EXPIRED').length; return { plan: plan.name, activeMembers: active, newSales: memberships.length - renewals.filter((item) => item.planId === plan.id).length, renewals: renewals.filter((item) => item.planId === plan.id).length, revenue, averageRevenue: revenue / Math.max(memberIds.size, 1), expiryRate: active + expired ? (expired / (active + expired)) * 100 : 0 }; });
  return { title: 'Membership Plan Performance', subtitle: 'Compare plan adoption, actual revenue, renewals, and expiry rates.', kpis: [stat('Plans', rows.length, 'pi pi-list', 'membership'), stat('Active Members', rows.reduce((sum, item) => sum + item.activeMembers, 0), 'pi pi-users', 'growth'), stat('New Sales', rows.reduce((sum, item) => sum + item.newSales, 0), 'pi pi-plus', 'members'), stat('Revenue', rows.reduce((sum, item) => sum + item.revenue, 0), 'pi pi-wallet', 'revenue', { format: 'currency' })], charts: [chart('Revenue by Plan', 'bar', rows.map((item) => item.plan), [{ label: 'Revenue', data: rows.map((item) => item.revenue), backgroundColor: COLORS.revenue }]), chart('Active Members by Plan', 'doughnut', rows.map((item) => item.plan), [{ data: rows.map((item) => item.activeMembers), backgroundColor: [COLORS.members, COLORS.attendance, COLORS.membership, COLORS.revenue] }])], columns: [column('plan', 'Plan'), column('activeMembers', 'Active Members', 'number'), column('newSales', 'New Sales', 'number'), column('renewals', 'Renewals', 'number'), column('revenue', 'Revenue', 'currency'), column('averageRevenue', 'Average Revenue/Member', 'currency'), column('expiryRate', 'Expiry Rate', 'percent')], rows };
}

export function getDailyOperationsReport(source, config) {
  const dailyConfig = { ...config, range: { startDate: toBusinessDateKey(), endDate: toBusinessDateKey() } };
  const result = getGymOverview(source, dailyConfig);
  return { ...result, title: 'Daily Operations', subtitle: "Today's check-ins, members, renewals, payments, and collection in one operational view." };
}

export function getRetentionReport(source, config) {
  const result = getMembershipReport(source, config);
  const renewedMembers = new Set(getRenewalMemberships(source.memberships, config.range).map((item) => item.memberId)).size;
  const eligible = source.memberships.filter((item) => isDateInRange(item.endDate, config.range)).length;
  result.title = 'Member Retention';
  result.subtitle = 'Renewal behavior and membership continuation for the selected period.';
  result.kpis.unshift(stat('Retention Rate', eligible ? (renewedMembers / eligible) * 100 : 0, 'pi pi-percentage', 'growth', { format: 'percent' }));
  return result;
}

export function getBusinessSummary(source, config, title) {
  const result = getGymOverview(source, config);
  const memberships = filterByDate(source.memberships, 'startDate', config.range);
  const attendance = deduplicateAttendance(filterByDate(source.attendance, 'checkInTime', config.range));
  const payments = collectedPayments(source.payments, config.range);
  const keyLength = title.includes('Year') ? 7 : 10;
  const keys = new Set([...memberships.map((item) => String(item.startDate).slice(0, keyLength)), ...attendance.map((item) => String(item.checkInTime).slice(0, keyLength)), ...payments.map((item) => String(item.paymentDate).slice(0, keyLength))]);
  result.title = title;
  result.rows = [...keys].sort().map((period) => ({ period, newMembers: source.members.filter((item) => String(item.joiningDate).startsWith(period)).length, renewals: getRenewalMemberships(source.memberships, config.range).filter((item) => String(item.startDate).startsWith(period)).length, visits: attendance.filter((item) => String(item.checkInTime).startsWith(period)).length, revenue: payments.filter((item) => String(item.paymentDate).startsWith(period)).reduce((sum, item) => sum + Number(item.amount || 0), 0) }));
  result.columns = [column('period', title.includes('Year') ? 'Month' : 'Date'), column('newMembers', 'New', 'number'), column('renewals', 'Renewals', 'number'), column('visits', 'Visits', 'number'), column('revenue', 'Revenue', 'currency')];
  if (title === 'Year-over-Year') {
    const previousYear = (dateKey) => {
      const date = new Date(`${dateKey}T00:00:00Z`);
      date.setUTCFullYear(date.getUTCFullYear() - 1);
      return date.toISOString().slice(0, 10);
    };
    const prior = { startDate: previousYear(config.range.startDate), endDate: previousYear(config.range.endDate) };
    const hasPriorData = source.payments.some((item) => isDateInRange(item.paymentDate, prior)) || source.attendance.some((item) => isDateInRange(item.checkInTime, prior)) || source.members.some((item) => isDateInRange(item.joiningDate, prior));
    if (!hasPriorData) {
      result.notice = 'Not enough historical data for comparison.';
      result.kpis = result.kpis.map((item) => ({ ...item, comparison: null }));
    }
  }
  return result;
}

export function getPersonalTrainingReport(source, config, mode) {
  const subscriptions = (source.personalTrainingSubscriptions || []).filter((item) =>
    (!config.filters?.trainerId || item.trainerId === config.filters.trainerId) &&
    (!config.filters?.personalTrainingStatus || item.status === config.filters.personalTrainingStatus)
  );
  const payments = collectedPayments(source.payments || [], config.range);
  const membersById = new Map((source.members || []).map((member) => [member.id, member]));

  if (mode === 'REVENUE') {
    const rows = payments.filter((payment) => Number(payment.personalTrainingAmount || 0) > 0).map((payment) => ({ ...payment, ptRevenue: Number(payment.personalTrainingAmount || 0) }));
    const revenue = rows.reduce((sum, payment) => sum + payment.ptRevenue, 0);
    return { title: 'Personal Training Revenue', subtitle: 'Actual PT collections from successful payment records.', kpis: [stat('PT Revenue', revenue, 'pi pi-wallet', 'trainers', { format: 'currency' }), stat('PT Payments', rows.length, 'pi pi-receipt', 'attendance'), stat('Average PT Payment', revenue / Math.max(rows.length, 1), 'pi pi-calculator', 'members', { format: 'currency' })], charts: [trendChart('PT Revenue Trend', rows, 'paymentDate', (item) => item.ptRevenue, COLORS.trainers, 'PT Revenue')], columns: [column('paymentDate', 'Date', 'date'), column('receiptNumber', 'Receipt'), column('memberName', 'Member'), column('ptRevenue', 'PT Revenue', 'currency'), column('paymentMode', 'Payment Mode')], rows };
  }

  if (mode === 'TRAINER') {
    const rows = (source.trainers || []).filter((trainer) => !config.filters?.trainerId || trainer.id === config.filters.trainerId).map((trainer) => {
      const records = subscriptions.filter((item) => item.trainerId === trainer.id);
      const ids = new Set(records.map((item) => item.id));
      const ptRevenue = payments.filter((payment) => ids.has(payment.personalTrainingSubscriptionId)).reduce((sum, payment) => sum + Number(payment.personalTrainingAmount || 0), 0);
      return { trainer: trainer.fullName, activePtMembers: new Set(records.filter((item) => item.status === 'ACTIVE').map((item) => item.memberId)).size, ptRevenue, ptMemberships: records.length, expiringPt: records.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 30).length, renewals: Math.max(records.length - new Set(records.map((item) => item.memberId)).size, 0) };
    });
    return { title: 'PT Trainer Performance', subtitle: 'PT members, actual revenue, expiries, and renewals by trainer.', kpis: [stat('Active PT Members', rows.reduce((sum, item) => sum + item.activePtMembers, 0), 'pi pi-users', 'growth'), stat('PT Revenue', rows.reduce((sum, item) => sum + item.ptRevenue, 0), 'pi pi-wallet', 'trainers', { format: 'currency' }), stat('Expiring PT', rows.reduce((sum, item) => sum + item.expiringPt, 0), 'pi pi-clock', 'warning')], charts: [chart('PT Revenue by Trainer', 'bar', rows.map((item) => item.trainer), [{ label: 'PT Revenue', data: rows.map((item) => item.ptRevenue), backgroundColor: COLORS.trainers }])], columns: [column('trainer', 'Trainer'), column('activePtMembers', 'Active PT Members', 'number'), column('ptRevenue', 'PT Revenue', 'currency'), column('ptMemberships', 'PT Memberships', 'number'), column('expiringPt', 'Expiring PT', 'number'), column('renewals', 'Renewals', 'number')], rows };
  }

  if (mode === 'PLAN') {
    const rows = (source.personalTrainingPlans || []).map((plan) => { const records = subscriptions.filter((item) => item.planId === plan.id); return { plan: plan.name, duration: `${plan.duration} ${plan.durationUnit}`, subscriptions: records.length, activeMembers: records.filter((item) => item.status === 'ACTIVE').length, value: records.reduce((sum, item) => sum + Number(item.amount || 0), 0), status: plan.status }; });
    return { title: 'PT Plan Performance', subtitle: 'Adoption and subscription value by Personal Training plan.', kpis: [stat('PT Plans', rows.length, 'pi pi-list', 'trainers'), stat('Active PT Members', rows.reduce((sum, item) => sum + item.activeMembers, 0), 'pi pi-users', 'growth')], charts: [chart('PT Plan Adoption', 'bar', rows.map((item) => item.plan), [{ label: 'Subscriptions', data: rows.map((item) => item.subscriptions), backgroundColor: COLORS.trainers }])], columns: [column('plan', 'PT Plan'), column('duration', 'Duration'), column('subscriptions', 'Subscriptions', 'number'), column('activeMembers', 'Active PT Members', 'number'), column('value', 'Subscription Value', 'currency'), column('status', 'Status', 'status')], rows };
  }

  const rows = subscriptions.map((item) => ({ member: membersById.get(item.memberId)?.fullName || 'Unknown Member', trainer: item.trainerName, plan: item.planName, endDate: item.endDate, daysRemaining: item.daysRemaining, amount: item.amount, status: item.status })).sort((a, b) => a.daysRemaining - b.daysRemaining);
  return { title: 'Personal Training Expiry', subtitle: 'PT expired or approaching expiry, sorted by urgency.', kpis: [stat('Expiring in 7 Days', rows.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 7).length, 'pi pi-clock', 'warning'), stat('Expiring in 30 Days', rows.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 30).length, 'pi pi-calendar', 'membership'), stat('Expired PT', rows.filter((item) => item.daysRemaining < 0 || item.status === 'EXPIRED').length, 'pi pi-times-circle', 'critical')], charts: [], columns: [column('member', 'Member'), column('trainer', 'Trainer'), column('plan', 'PT Plan'), column('endDate', 'End Date', 'date'), column('daysRemaining', 'Days Remaining', 'number'), column('amount', 'Amount', 'currency'), column('status', 'Status', 'status')], rows };
}

export function buildReport(source, config) {
  const type = config.reportType;
  const definition = REPORT_DEFINITIONS.find((item) => item.value === type);
  if (definition && !definition.roles.includes(config.role)) {
    throw new Error('You do not have permission to view this report.');
  }
  const filtered = applyFilters(source, config);
  if (type === REPORT_TYPE.GYM_OVERVIEW) return getGymOverview(filtered, config);
  if (type === REPORT_TYPE.REVENUE_COLLECTIONS) return getRevenueReport(filtered, config);
  if (type === REPORT_TYPE.MEMBERSHIP_PERFORMANCE) return getMembershipReport(filtered, config);
  if (type === REPORT_TYPE.MEMBER_GROWTH) return getMemberGrowthReport(filtered, config);
  if (type === REPORT_TYPE.MEMBER_ACTIVITY) return getMemberActivityReport(filtered, config);
  if (type === REPORT_TYPE.MEMBER_RETENTION) return getRetentionReport(filtered, config);
  if (type === REPORT_TYPE.MEMBER_ATTENDANCE) return getMemberAttendanceReport(filtered, config);
  if (type === REPORT_TYPE.MEMBERSHIP_EXPIRY) return getExpiryReport(filtered, config);
  if (type === REPORT_TYPE.OUTSTANDING_PAYMENTS) return getOutstandingReport(filtered, config);
  if (type === REPORT_TYPE.ATTENDANCE_OVERVIEW) return getAttendanceReport(filtered, config);
  if (type === REPORT_TYPE.ATTENDANCE_TRENDS) return getAttendanceReport(filtered, config, 'TRENDS');
  if (type === REPORT_TYPE.PEAK_HOURS) return getAttendanceReport(filtered, config, 'PEAK');
  if (type === REPORT_TYPE.DAILY_ATTENDANCE) return getAttendanceReport(filtered, config, 'DAILY');
  if (type === REPORT_TYPE.TRAINER_PERFORMANCE) return getTrainerReport(filtered, config);
  if (type === REPORT_TYPE.TRAINER_MEMBER_ACTIVITY) return getTrainerReport(filtered, config, true);
  if (type === REPORT_TYPE.PLAN_PERFORMANCE) return getPlanPerformanceReport(filtered, config);
  if (type === REPORT_TYPE.PT_REVENUE) return getPersonalTrainingReport(filtered, config, 'REVENUE');
  if (type === REPORT_TYPE.PT_TRAINER_PERFORMANCE) return getPersonalTrainingReport(filtered, config, 'TRAINER');
  if (type === REPORT_TYPE.PT_EXPIRY) return getPersonalTrainingReport(filtered, config, 'EXPIRY');
  if (type === REPORT_TYPE.PT_PLAN_PERFORMANCE) return getPersonalTrainingReport(filtered, config, 'PLAN');
  if (type === REPORT_TYPE.DAILY_OPERATIONS) return getDailyOperationsReport(filtered, config);
  if (type === REPORT_TYPE.YEARLY_SUMMARY) return getBusinessSummary(filtered, config, 'Yearly Business Summary');
  if (type === REPORT_TYPE.MONTHLY_SUMMARY) return getBusinessSummary(filtered, config, 'Monthly Business Summary');
  if (type === REPORT_TYPE.YEAR_OVER_YEAR) return getBusinessSummary(filtered, config, 'Year-over-Year');
  return getGymOverview(filtered, config);
}