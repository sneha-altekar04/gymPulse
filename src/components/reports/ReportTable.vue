<script setup>
import { computed, ref, watch } from 'vue';
import Button from 'primevue/button';
import Paginator from 'primevue/paginator';

import StatusBadge from '../common/StatusBadge.vue';
import { formatCurrency, formatDate, formatDateTime, formatPaymentMethod, formatTime } from '../../utils/formatters';

const props = defineProps({ columns: { type: Array, default: () => [] }, rows: { type: Array, default: () => [] }, loading: { type: Boolean, default: false }, actions: { type: String, default: '' } });
const emit = defineEmits(['action']);
const page = ref(0);
const rowsPerPage = ref(10);
const sortKey = ref('');
const sortDirection = ref(1);
watch(() => props.rows, () => { page.value = 0; });
const sortedRows = computed(() => {
  if (!sortKey.value) return props.rows;
  return [...props.rows].sort((left, right) => {
    const a = left[sortKey.value] ?? '';
    const b = right[sortKey.value] ?? '';
    return (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), undefined, { numeric: true })) * sortDirection.value;
  });
});
const visibleRows = computed(() => sortedRows.value.slice(page.value * rowsPerPage.value, (page.value + 1) * rowsPerPage.value));
function sort(column) { if (!column.sortable) return; if (sortKey.value === column.key) sortDirection.value *= -1; else { sortKey.value = column.key; sortDirection.value = 1; } }
function display(value, format) {
  if (value === null || value === undefined || value === '') return '--';
  if (format === 'currency') return formatCurrency(Number(value));
  if (format === 'date') return formatDate(value);
  if (format === 'dateTime') return formatDateTime(value);
  if (format === 'time') return formatTime(value);
  if (format === 'number') return new Intl.NumberFormat('en-IN').format(Number(value));
  if (format === 'decimal') return Number(value).toFixed(1);
  if (format === 'percent') return `${Number(value).toFixed(1)}%`;
  if (format === 'paymentMode' || format === 'paymentMethod') return formatPaymentMethod(value);
  return value;
}
</script>

<template>
  <div class="report-table-wrap">
    <div v-if="loading" class="report-table-loading"><i class="pi pi-spin pi-spinner" /><span>Preparing report...</span></div>
    <div v-else-if="rows.length" class="app-table-wrap"><table class="app-table report-table"><thead><tr><th v-for="item in columns" :key="item.key" @click="sort(item)"><button type="button" class="report-table__sort">{{ item.label }}<i v-if="sortKey === item.key" :class="sortDirection > 0 ? 'pi pi-sort-up' : 'pi pi-sort-down'" /></button></th><th v-if="actions">Actions</th></tr></thead><tbody><tr v-for="(row, index) in visibleRows" :key="row.id || `${page}-${index}`"><td v-for="item in columns" :key="item.key"><StatusBadge v-if="item.format === 'status'" :status="String(row[item.key] || '--')" /><template v-else>{{ display(row[item.key], item.format) }}</template></td><td v-if="actions" class="table-actions"><Button icon="pi pi-eye" text aria-label="View member" title="View member" @click="emit('action', 'view', row)" /><Button v-if="actions === 'MEMBERSHIP'" icon="pi pi-refresh" text aria-label="Renew membership" title="Renew membership" @click="emit('action', 'renew', row)" /><Button icon="pi pi-wallet" text aria-label="Record payment" title="Record payment" @click="emit('action', 'payment', row)" /><Button v-if="actions === 'MEMBERSHIP'" icon="pi pi-send" text aria-label="Send reminder" title="Send reminder" @click="emit('action', 'message', row)" /></td></tr></tbody></table></div>
    <div v-else class="report-table-empty"><i class="pi pi-inbox" /><h3>No report data</h3><p>No records match the selected period and filters.</p></div>
    <Paginator v-if="rows.length > rowsPerPage" :first="page * rowsPerPage" :rows="rowsPerPage" :total-records="rows.length" :rows-per-page-options="[10, 25, 50]" @page="page = $event.page; rowsPerPage = $event.rows" />
  </div>
</template>