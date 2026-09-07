export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPaymentMethod(value) {
  if (!value) {
    return '--';
  }

  return String(value)
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  }).format(date);
}

export function formatTime(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  }).format(date);
}

export function formatDateTime(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  }).format(date);
}

export function toInputDate(dateValue = new Date()) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

export function toInputDateTime(dateValue = new Date()) {
  return new Date(dateValue).toISOString().slice(0, 16);
}

export function formatDurationFromTimes(checkIn, checkOut) {
  if (!checkIn || !checkOut) {
    return '--';
  }

  const minutes = Math.max(Math.round((new Date(checkOut) - new Date(checkIn)) / 60000), 0);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export function daysRemainingFromDate(endDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const target = new Date(endDate);
  target.setHours(0, 0, 0, 0);

  return Math.floor((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}