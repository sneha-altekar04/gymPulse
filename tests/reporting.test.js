import assert from 'node:assert/strict';
import test from 'node:test';

import { DATE_RANGE, REPORT_DEFINITIONS, REPORT_TYPE } from '../src/constants/reporting.js';
import { buildReport } from '../src/services/firebase/reportService.js';
import { deduplicateAttendance, sumCollection } from '../src/services/reportCalculations.js';
import { createReportCsv } from '../src/utils/reportExport.js';
import { resolveDateRange } from '../src/utils/reportDateUtils.js';

const now = new Date('2026-09-15T04:00:00Z');
const range = { startDate: '2026-09-01', endDate: '2026-09-30' };
const source = {
  members: [
    { id: 'm1', fullName: 'Rahul Patil', mobile: '9876543210', joiningDate: '2026-09-01', trainerId: 't1', membershipStatus: 'ACTIVE', membershipPlanName: 'Monthly', membershipExpiryDate: '2026-09-30', outstandingBalance: 500, latestMembership: { id: 'ms2', planId: 'p1', endDate: '2026-09-30', finalAmount: 1500, amountPaid: 1000 } },
    { id: 'm2', fullName: 'Neha Joshi', mobile: '9876543211', joiningDate: '2026-08-01', trainerId: 't2', membershipStatus: 'EXPIRED', membershipPlanName: 'Quarterly', membershipExpiryDate: '2026-08-31', outstandingBalance: 0, latestMembership: { id: 'ms3', planId: 'p2', endDate: '2026-08-31', finalAmount: 4000, amountPaid: 4000 } }
  ],
  memberships: [
    { id: 'ms1', memberId: 'm1', planId: 'p1', planName: 'Monthly', startDate: '2026-08-01', endDate: '2026-08-31', finalAmount: 1500, amountPaid: 1500, status: 'EXPIRED', daysRemaining: -15 },
    { id: 'ms2', memberId: 'm1', planId: 'p1', planName: 'Monthly', startDate: '2026-09-01', endDate: '2026-09-30', finalAmount: 1500, amountPaid: 1000, status: 'ACTIVE', daysRemaining: 15 },
    { id: 'ms3', memberId: 'm2', planId: 'p2', planName: 'Quarterly', startDate: '2026-06-01', endDate: '2026-08-31', finalAmount: 4000, amountPaid: 4000, status: 'EXPIRED', daysRemaining: -15 }
  ],
  attendance: [
    { id: 'a1', eventKey: 'event-1', memberId: 'm1', checkInTime: '2026-09-01T01:00:00Z', source: 'MANUAL' },
    { id: 'a2', eventKey: 'event-1', memberId: 'm1', checkInTime: '2026-09-01T01:00:00Z', source: 'MANUAL' },
    { id: 'a3', eventKey: 'event-2', memberId: 'm2', checkInTime: '2026-08-15T01:00:00Z', source: 'FINGERPRINT' }
  ],
  payments: [
    { id: 'pay1', memberId: 'm1', membershipId: 'ms2', memberName: 'Rahul Patil', membershipPlanName: 'Monthly', paymentDate: '2026-09-01', amount: 1000, paymentMode: 'UPI', status: 'PAID' },
    { id: 'pay2', memberId: 'm1', membershipId: 'ms2', memberName: 'Rahul Patil', membershipPlanName: 'Monthly', paymentDate: '2026-09-02', amount: 500, paymentMode: 'CASH', status: 'REFUNDED' }
  ],
  trainers: [{ id: 't1', fullName: 'Amit Trainer' }, { id: 't2', fullName: 'Priya Trainer' }],
  plans: [{ id: 'p1', name: 'Monthly' }, { id: 'p2', name: 'Quarterly' }]
};

const config = { reportType: REPORT_TYPE.GYM_OVERVIEW, range, filters: {}, compare: false, role: 'OWNER', trainerId: '' };

test('resolves all preset and custom business periods in Asia/Kolkata', () => {
  const expected = {
    [DATE_RANGE.TODAY]: ['2026-09-15', '2026-09-15'], [DATE_RANGE.YESTERDAY]: ['2026-09-14', '2026-09-14'],
    [DATE_RANGE.THIS_WEEK]: ['2026-09-14', '2026-09-15'], [DATE_RANGE.LAST_WEEK]: ['2026-09-07', '2026-09-13'],
    [DATE_RANGE.THIS_MONTH]: ['2026-09-01', '2026-09-15'], [DATE_RANGE.LAST_MONTH]: ['2026-08-01', '2026-08-31'],
    [DATE_RANGE.THIS_QUARTER]: ['2026-07-01', '2026-09-15'], [DATE_RANGE.LAST_QUARTER]: ['2026-04-01', '2026-06-30'],
    [DATE_RANGE.THIS_YEAR]: ['2026-01-01', '2026-09-15'], [DATE_RANGE.LAST_YEAR]: ['2025-01-01', '2025-12-31']
  };
  Object.entries(expected).forEach(([preset, dates]) => assert.deepEqual(Object.values(resolveDateRange(preset, [], now)), dates));
  assert.deepEqual(resolveDateRange(DATE_RANGE.CUSTOM, [new Date('2026-08-03T12:00:00Z'), new Date('2026-08-09T12:00:00Z')], now), { startDate: '2026-08-03', endDate: '2026-08-09' });
});

test('uses successful payment records and deduplicated attendance', () => {
  assert.equal(sumCollection(source.payments, range), 1000);
  assert.equal(deduplicateAttendance(source.attendance).length, 2);
  const overview = buildReport(source, config);
  assert.equal(overview.kpis.find((item) => item.label === 'Collection').value, 1000);
  assert.equal(overview.kpis.find((item) => item.label === 'Attendance').value, 1);
});

test('builds every report through one result contract', () => {
  Object.values(REPORT_TYPE).forEach((reportType) => {
    const result = buildReport(source, { ...config, reportType });
    assert.ok(result.title);
    assert.ok(Array.isArray(result.kpis));
    assert.ok(Array.isArray(result.charts));
    assert.ok(Array.isArray(result.columns));
    assert.ok(Array.isArray(result.rows));
  });
});

test('supports single and combined member trainer plan filters', () => {
  const result = buildReport(source, { ...config, reportType: REPORT_TYPE.MEMBER_ACTIVITY, filters: { memberId: 'm1', trainerId: 't1', planId: 'p1' } });
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].member, 'Rahul Patil');
  const noMatch = buildReport(source, { ...config, reportType: REPORT_TYPE.MEMBER_ACTIVITY, filters: { memberId: 'm1', trainerId: 't2' } });
  assert.equal(noMatch.rows.length, 0);
});

test('trainer role is scoped and fails closed without a trainer mapping', () => {
  const scoped = buildReport(source, { ...config, reportType: REPORT_TYPE.MEMBER_ACTIVITY, role: 'TRAINER', trainerId: 't1' });
  assert.deepEqual(scoped.rows.map((item) => item.member), ['Rahul Patil']);
  const unmapped = buildReport(source, { ...config, reportType: REPORT_TYPE.MEMBER_ACTIVITY, role: 'TRAINER', trainerId: '' });
  assert.equal(unmapped.rows.length, 0);
  assert.equal(REPORT_DEFINITIONS.find((item) => item.value === REPORT_TYPE.REVENUE_COLLECTIONS).roles.includes('TRAINER'), false);
  assert.throws(
    () => buildReport(source, { ...config, reportType: REPORT_TYPE.YEARLY_SUMMARY, role: 'RECEPTIONIST' }),
    /do not have permission/
  );
});

test('no-data periods and year-over-year history are honest', () => {
  const noDataRange = { startDate: '2024-01-01', endDate: '2024-12-31' };
  const empty = buildReport(source, { ...config, reportType: REPORT_TYPE.ATTENDANCE_OVERVIEW, range: noDataRange });
  assert.equal(empty.rows.length, 0);
  const year = buildReport(source, { ...config, reportType: REPORT_TYPE.YEAR_OVER_YEAR, range });
  assert.equal(year.notice, 'Not enough historical data for comparison.');
});

test('handles incomplete membership snapshots without misleading blanks', () => {
  const incompleteMember = { ...source.members[0], id: 'm3', membershipExpiryDate: '2026-10-15', outstandingBalance: 750, latestMembership: null };
  const incompleteSource = { ...source, members: [...source.members, incompleteMember] };
  const expiry = buildReport(incompleteSource, { ...config, reportType: REPORT_TYPE.MEMBERSHIP_EXPIRY });
  assert.equal(expiry.rows.at(-1).id, 'm3');
  const outstanding = buildReport(incompleteSource, { ...config, reportType: REPORT_TYPE.OUTSTANDING_PAYMENTS });
  const row = outstanding.rows.find((item) => item.id === 'm3');
  assert.equal(row.totalAmount, 0);
  assert.equal(row.paid, 0);
});

test('handles a large result set and exports the filtered report', () => {
  const largeSource = { ...source, members: Array.from({ length: 2500 }, (_, index) => ({ ...source.members[0], id: `large-${index}`, fullName: `Member ${index}` })) };
  const result = buildReport(largeSource, { ...config, reportType: REPORT_TYPE.MEMBER_ACTIVITY });
  assert.equal(result.rows.length, 2500);
  const csv = createReportCsv({ report: result, config });
  assert.match(csv, /Applied Filters/);
  assert.match(csv, /Member 2499/);
});

test('reports actual PT collections separately from membership revenue', () => {
  const ptSource = {
    ...source,
    payments: [{ id: 'pt-pay', memberId: 'm1', membershipId: 'ms2', personalTrainingSubscriptionId: 'pt1', memberName: 'Rahul Patil', paymentDate: '2026-09-05', amount: 8500, membershipAmount: 3500, personalTrainingAmount: 5000, paymentMode: 'UPI', status: 'PAID' }],
    personalTrainingPlans: [{ id: 'pt-plan', name: 'PT - 3 Months', duration: 3, durationUnit: 'MONTH', status: 'ACTIVE' }],
    personalTrainingSubscriptions: [{ id: 'pt1', memberId: 'm1', trainerId: 't1', trainerName: 'Amit Trainer', planId: 'pt-plan', planName: 'PT - 3 Months', amount: 5000, status: 'ACTIVE', endDate: '2026-11-30', daysRemaining: 76 }]
  };
  const revenue = buildReport(ptSource, { ...config, reportType: REPORT_TYPE.REVENUE_COLLECTIONS });
  assert.equal(revenue.kpis.find((item) => item.label === 'Membership Revenue').value, 3500);
  assert.equal(revenue.kpis.find((item) => item.label === 'Personal Training Revenue').value, 5000);
  assert.equal(revenue.kpis.find((item) => item.label === 'Total Revenue').value, 8500);
  const ptRevenue = buildReport(ptSource, { ...config, reportType: REPORT_TYPE.PT_REVENUE });
  assert.equal(ptRevenue.rows[0].ptRevenue, 5000);
});