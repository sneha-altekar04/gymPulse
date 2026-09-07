import { formatCurrency, formatDate, formatDateTime, formatTime } from './formatters.js';

function csvValue(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function display(value, format) {
  if (value === null || value === undefined || value === '') return '';
  if (format === 'currency') return formatCurrency(Number(value));
  if (format === 'date') return formatDate(value);
  if (format === 'dateTime') return formatDateTime(value);
  if (format === 'time') return formatTime(value);
  if (format === 'percent') return `${Number(value).toFixed(1)}%`;
  return value;
}

export function createReportCsv({ report, config, generatedAt = new Date() }) {
  const appliedFilters = Object.entries(config.filters || {}).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join(', ') || 'None';
  const lines = [
    [report.title],
    ['Generated', formatDateTime(generatedAt)],
    ['Period', `${config.range.startDate} to ${config.range.endDate}`],
    ['Applied Filters', appliedFilters],
    [],
    report.columns.map((item) => item.label),
    ...report.rows.map((row) => report.columns.map((item) => display(row[item.key], item.format)))
  ];
  return lines.map((line) => line.map(csvValue).join(',')).join('\r\n');
}

export function downloadReportCsv(report, config) {
  const csv = createReportCsv({ report, config });
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const period = config.range.startDate.slice(0, 7).replace('-', '_');
  link.download = `K3Oxygen_${report.title.replace(/[^a-z0-9]+/gi, '_')}_${period}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}