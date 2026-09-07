import { MESSAGE_TYPE } from '../constants/domain.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export function renderMessageTemplate(content, variables = {}) {
  return String(content || '').replace(/{{\s*([a-zA-Z][a-zA-Z0-9]*)\s*}}/g, (placeholder, key) => {
    const value = variables[key];
    return value === undefined || value === null ? placeholder : String(value);
  });
}

export function normalizeIndianPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  const localNumber = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;

  if (!/^[6-9]\d{9}$/.test(localNumber)) {
    return null;
  }

  return `+91${localNumber}`;
}

export function getDateKeyInTimeZone(date = new Date(), timeZone = 'Asia/Kolkata') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function differenceInCalendarDays(endDate, now = new Date(), timeZone = 'Asia/Kolkata') {
  const endDateKey = typeof endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ? endDate
    : getDateKeyInTimeZone(new Date(endDate), timeZone);
  const todayKey = getDateKeyInTimeZone(now, timeZone);
  return Math.round((Date.parse(`${endDateKey}T00:00:00Z`) - Date.parse(`${todayKey}T00:00:00Z`)) / DAY_MS);
}

export function getExpiryNotificationType(endDate, reminderDays, includeExpiryDay = false, now = new Date()) {
  const daysRemaining = differenceInCalendarDays(endDate, now);
  const enabledDays = new Set((reminderDays || []).map(Number));

  if (daysRemaining === 0 && includeExpiryDay) {
    return MESSAGE_TYPE.MEMBERSHIP_EXPIRED;
  }

  if (!enabledDays.has(daysRemaining)) {
    return null;
  }

  const typeByDay = {
    7: MESSAGE_TYPE.EXPIRY_7_DAYS,
    3: MESSAGE_TYPE.EXPIRY_3_DAYS,
    1: MESSAGE_TYPE.EXPIRY_1_DAY
  };
  return typeByDay[daysRemaining] || `EXPIRY_${daysRemaining}_DAYS`;
}

export function createMessageIdempotencyKey(gymId, memberId, notificationType, expiryDate) {
  return [gymId, memberId, notificationType, String(expiryDate).slice(0, 10)]
    .map((value) => encodeURIComponent(String(value || '').trim()))
    .join('__');
}