const DAY_MS = 24 * 60 * 60 * 1000;

export function toBusinessDateKey(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date(value));
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function keyToDate(key) {
  return new Date(`${key}T00:00:00Z`);
}

function dateToKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function resolveDateRange(preset, customRange = [], now = new Date()) {
  const today = keyToDate(toBusinessDateKey(now));
  let start = today;
  let end = today;
  const day = today.getUTCDay() || 7;

  if (preset === 'YESTERDAY') start = end = addDays(today, -1);
  if (preset === 'THIS_WEEK') start = addDays(today, 1 - day);
  if (preset === 'LAST_WEEK') {
    end = addDays(today, -day);
    start = addDays(end, -6);
  }
  if (preset === 'THIS_MONTH') start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  if (preset === 'LAST_MONTH') {
    start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
  }
  if (preset === 'THIS_QUARTER') start = new Date(Date.UTC(today.getUTCFullYear(), Math.floor(today.getUTCMonth() / 3) * 3, 1));
  if (preset === 'LAST_QUARTER') {
    const currentQuarterMonth = Math.floor(today.getUTCMonth() / 3) * 3;
    start = new Date(Date.UTC(today.getUTCFullYear(), currentQuarterMonth - 3, 1));
    end = new Date(Date.UTC(today.getUTCFullYear(), currentQuarterMonth, 0));
  }
  if (preset === 'THIS_YEAR') start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
  if (preset === 'LAST_YEAR') {
    start = new Date(Date.UTC(today.getUTCFullYear() - 1, 0, 1));
    end = new Date(Date.UTC(today.getUTCFullYear() - 1, 11, 31));
  }
  if (preset === 'CUSTOM' && customRange?.[0] && customRange?.[1]) {
    start = keyToDate(toBusinessDateKey(customRange[0]));
    end = keyToDate(toBusinessDateKey(customRange[1]));
  }

  return { startDate: dateToKey(start), endDate: dateToKey(end) };
}

export function previousPeriod({ startDate, endDate }) {
  const start = keyToDate(startDate);
  const end = keyToDate(endDate);
  const periodDays = Math.round((end - start) / DAY_MS) + 1;
  const previousEnd = addDays(start, -1);
  return { startDate: dateToKey(addDays(previousEnd, 1 - periodDays)), endDate: dateToKey(previousEnd) };
}

export function isDateInRange(value, range) {
  if (!value) return false;
  const key = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : toBusinessDateKey(value);
  return key >= range.startDate && key <= range.endDate;
}

export function daysInRange(range) {
  return Math.max(Math.round((keyToDate(range.endDate) - keyToDate(range.startDate)) / DAY_MS) + 1, 1);
}