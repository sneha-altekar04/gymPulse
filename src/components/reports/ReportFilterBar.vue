<script setup>
import { computed, reactive, ref, watch } from 'vue';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputSwitch from 'primevue/inputswitch';

import { DATE_RANGE, DATE_RANGE_OPTIONS } from '../../constants/reporting';

const props = defineProps({
  modelValue: { type: Object, required: true },
  reportDefinitions: { type: Array, required: true },
  members: { type: Array, default: () => [] },
  trainers: { type: Array, default: () => [] },
  plans: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:modelValue', 'apply', 'reset']);
const advancedVisible = ref(false);
const draft = reactive({ reportType: '', datePreset: DATE_RANGE.THIS_MONTH, customRange: null, compare: true, filters: {} });

watch(() => props.modelValue, (value) => {
  Object.assign(draft, { ...value, filters: { ...(value.filters || {}) } });
}, { immediate: true, deep: true });

const groupedReports = computed(() => {
  const groups = new Map();
  props.reportDefinitions.forEach((report) => {
    if (!groups.has(report.category)) groups.set(report.category, []);
    groups.get(report.category).push(report);
  });
  return [...groups].map(([label, items]) => ({ label, items }));
});

const memberOptions = computed(() => [{ id: '', fullName: 'All Members' }, ...props.members]);
const trainerOptions = computed(() => [{ id: '', fullName: 'All Trainers' }, ...props.trainers]);
const planOptions = computed(() => [{ id: '', name: 'All Plans' }, ...props.plans]);
const membershipStatuses = [{ label: 'All Statuses', value: '' }, { label: 'Active', value: 'ACTIVE' }, { label: 'Expiring Soon', value: 'EXPIRING SOON' }, { label: 'Expired', value: 'EXPIRED' }, { label: 'Inactive', value: 'INACTIVE' }];
const paymentStatuses = [{ label: 'All Payment Statuses', value: '' }, ...['PAID', 'PARTIAL', 'PENDING', 'REFUNDED'].map((value) => ({ label: value, value }))];
const paymentModes = [{ label: 'All Payment Modes', value: '' }, ...['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'].map((value) => ({ label: value.replace('_', ' '), value }))];
const attendanceSources = [{ label: 'All Sources', value: '' }, { label: 'Manual', value: 'MANUAL' }, { label: 'Fingerprint', value: 'FINGERPRINT' }];
const activityLevels = [{ label: 'All Activity Levels', value: '' }, ...['HIGHLY ACTIVE', 'ACTIVE', 'LOW ACTIVITY', 'INACTIVE'].map((value) => ({ label: value, value }))];
const personalTrainingStatuses = [{ label: 'All PT Statuses', value: '' }, ...['ACTIVE', 'EXPIRED', 'CANCELLED', 'PAUSED'].map((value) => ({ label: value, value }))];

function apply() {
  const value = { ...draft, filters: { ...draft.filters } };
  emit('update:modelValue', value);
  emit('apply', value);
}

function reset() {
  const value = { reportType: props.reportDefinitions[0]?.value, datePreset: DATE_RANGE.THIS_MONTH, customRange: null, compare: true, filters: {} };
  Object.assign(draft, value);
  emit('update:modelValue', value);
  emit('reset', value);
}
</script>

<template>
  <section class="report-filter-bar" aria-label="Report configuration">
    <div class="report-filter-bar__primary">
      <label class="app-field report-filter-bar__report"><span>Report Type</span><Dropdown v-model="draft.reportType" :options="groupedReports" option-label="label" option-value="value" option-group-label="label" option-group-children="items" /></label>
      <label class="app-field"><span>Date Range</span><Dropdown v-model="draft.datePreset" :options="DATE_RANGE_OPTIONS" option-label="label" option-value="value" /></label>
      <label v-if="draft.datePreset === DATE_RANGE.CUSTOM" class="app-field"><span>Custom Range</span><Calendar v-model="draft.customRange" selection-mode="range" :manual-input="false" show-icon /></label>
      <label class="report-compare"><InputSwitch v-model="draft.compare" /><span>Compare previous period</span></label>
      <Button :label="advancedVisible ? 'Hide Filters' : 'Filters'" icon="pi pi-sliders-h" severity="secondary" outlined @click="advancedVisible = !advancedVisible" />
      <Button label="Apply" icon="pi pi-check" @click="apply" />
    </div>

    <div v-if="advancedVisible" class="report-filter-bar__advanced">
      <label class="app-field"><span>Member</span><Dropdown v-model="draft.filters.memberId" :options="memberOptions" option-label="fullName" option-value="id" filter /></label>
      <label class="app-field"><span>Trainer</span><Dropdown v-model="draft.filters.trainerId" :options="trainerOptions" option-label="fullName" option-value="id" filter /></label>
      <label class="app-field"><span>Membership Plan</span><Dropdown v-model="draft.filters.planId" :options="planOptions" option-label="name" option-value="id" /></label>
      <label class="app-field"><span>Membership Status</span><Dropdown v-model="draft.filters.membershipStatus" :options="membershipStatuses" option-label="label" option-value="value" /></label>
      <label class="app-field"><span>Payment Status</span><Dropdown v-model="draft.filters.paymentStatus" :options="paymentStatuses" option-label="label" option-value="value" /></label>
      <label class="app-field"><span>Payment Mode</span><Dropdown v-model="draft.filters.paymentMode" :options="paymentModes" option-label="label" option-value="value" /></label>
      <label class="app-field"><span>Attendance Source</span><Dropdown v-model="draft.filters.attendanceSource" :options="attendanceSources" option-label="label" option-value="value" /></label>
      <label class="app-field"><span>Activity Level</span><Dropdown v-model="draft.filters.activityLevel" :options="activityLevels" option-label="label" option-value="value" /></label>
      <label class="app-field"><span>Personal Training</span><Dropdown v-model="draft.filters.personalTrainingStatus" :options="personalTrainingStatuses" option-label="label" option-value="value" /></label>
      <Button label="Reset Filters" icon="pi pi-undo" text @click="reset" />
    </div>
  </section>
</template>