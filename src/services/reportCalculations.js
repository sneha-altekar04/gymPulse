import { ACTIVITY_THRESHOLDS } from '../constants/reporting.js';
import { daysInRange, isDateInRange, toBusinessDateKey } from '../utils/reportDateUtils.js';

export function filterByDate(records, field, range) {
  return records.filter((record) => isDateInRange(record[field], range));
}

export function deduplicateAttendance(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = record.eventKey || `${record.memberId}|${String(record.checkInTime).slice(0, 16)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function collectedPayments(records, range) {
  return filterByDate(records, 'paymentDate', range).filter((payment) => !['REFUNDED', 'CANCELLED'].includes(payment.status));
}

export function sumCollection(records, range) {
  return collectedPayments(records, range).reduce((total, payment) => total + Number(payment.amount || 0), 0);
}

export function percentageChange(current, previous) {
  if (!previous) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

export function classifyActivity(visits, lastVisitAt, range, now = new Date()) {
  const weeks = Math.max(daysInRange(range) / 7, 1);
  const visitsPerWeek = visits / weeks;
  const lastVisitDays = lastVisitAt
    ? Math.floor((Date.parse(`${toBusinessDateKey(now)}T00:00:00Z`) - Date.parse(`${toBusinessDateKey(lastVisitAt)}T00:00:00Z`)) / 86400000)
    : Infinity;

  if (lastVisitDays >= ACTIVITY_THRESHOLDS.INACTIVE_DAYS) return 'INACTIVE';
  if (visitsPerWeek >= ACTIVITY_THRESHOLDS.HIGHLY_ACTIVE_VISITS_PER_WEEK) return 'HIGHLY ACTIVE';
  if (visitsPerWeek >= ACTIVITY_THRESHOLDS.ACTIVE_VISITS_PER_WEEK) return 'ACTIVE';
  if (visitsPerWeek >= ACTIVITY_THRESHOLDS.LOW_ACTIVITY_VISITS_PER_WEEK) return 'LOW ACTIVITY';
  return 'INACTIVE';
}

export function getRenewalMemberships(memberships, range) {
  const memberCounts = new Map();
  return [...memberships]
    .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
    .filter((membership) => {
      const priorCount = memberCounts.get(membership.memberId) || 0;
      memberCounts.set(membership.memberId, priorCount + 1);
      return priorCount > 0 && isDateInRange(membership.startDate, range);
    });
}