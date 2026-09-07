<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';

import MemberAvatar from '../components/common/MemberAvatar.vue';
import PageHeader from '../components/common/PageHeader.vue';
import ReportChart from '../components/reports/ReportChart.vue';
import ReportFilterBar from '../components/reports/ReportFilterBar.vue';
import ReportStatCard from '../components/reports/ReportStatCard.vue';
import ReportTable from '../components/reports/ReportTable.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import { DATE_RANGE, REPORT_DEFINITIONS, REPORT_TYPE } from '../constants/reporting';
import { buildReport } from '../services/firebase/reportService';
import { useAuthStore } from '../stores/authStore';
import { useGymStore } from '../stores/gymStore';
import { formatDate } from '../utils/formatters';
import { downloadReportCsv } from '../utils/reportExport';
import { resolveDateRange } from '../utils/reportDateUtils';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();
const gymStore = useGymStore();
const loading = ref(false);
const report = ref(null);
const lastSignature = ref('');

const role = computed(() => authStore.userProfile?.role || 'RECEPTIONIST');
const availableReports = computed(() => REPORT_DEFINITIONS.filter((item) => item.roles.includes(role.value)));
const requestedType = computed(() => typeof route.query.report === 'string' ? route.query.report : '');
const defaultType = computed(() => availableReports.value.some((item) => item.value === requestedType.value)
  ? requestedType.value
  : role.value === 'TRAINER' ? REPORT_TYPE.MEMBER_ACTIVITY : REPORT_TYPE.GYM_OVERVIEW);

const initialFilters = computed(() => ({
  memberId: typeof route.query.memberId === 'string' ? route.query.memberId : '',
  trainerId: typeof route.query.trainerId === 'string' ? route.query.trainerId : '',
  planId: typeof route.query.planId === 'string' ? route.query.planId : '',
  membershipStatus: typeof route.query.status === 'string' ? route.query.status : '',
  paymentStatus: typeof route.query.paymentStatus === 'string' ? route.query.paymentStatus : '',
  paymentMode: '', attendanceSource: '',
  activityLevel: typeof route.query.activityLevel === 'string' ? route.query.activityLevel : ''
}));

const configModel = ref({
  reportType: defaultType.value,
  datePreset: typeof route.query.period === 'string' && Object.values(DATE_RANGE).includes(route.query.period) ? route.query.period : DATE_RANGE.THIS_MONTH,
  customRange: null,
  compare: true,
  filters: initialFilters.value
});
const appliedConfig = ref(null);

const source = computed(() => ({
  members: gymStore.membersDetailed,
  memberships: gymStore.membershipsDetailed,
  attendance: gymStore.attendanceDetailed,
  payments: gymStore.paymentsDetailed,
  trainers: gymStore.trainers,
  plans: gymStore.membershipPlans,
  personalTrainingPlans: gymStore.personalTrainingPlans,
  personalTrainingSubscriptions: gymStore.personalTrainingSubscriptionsDetailed
}));

const periodLabel = computed(() => appliedConfig.value
  ? `${formatDate(appliedConfig.value.range.startDate)} - ${formatDate(appliedConfig.value.range.endDate)}`
  : '');

const profileMembership = computed(() => report.value?.profile?.latestMembership || null);

function sanitizedFilters(filters) {
  return Object.fromEntries(Object.entries(filters || {}).filter(([, value]) => value !== '' && value !== null && value !== undefined));
}

async function runReport(nextConfig = configModel.value, force = false) {
  const range = resolveDateRange(nextConfig.datePreset, nextConfig.customRange);
  const config = {
    ...nextConfig,
    range,
    filters: sanitizedFilters(nextConfig.filters),
    role: role.value,
    trainerId: authStore.userProfile?.trainerId || authStore.userProfile?.trainerDocId || gymStore.trainers.find((trainer) => trainer.userId === authStore.currentUser?.uid || trainer.email === authStore.currentUser?.email)?.id || ''
  };
  const signature = JSON.stringify(config);
  if (!force && signature === lastSignature.value) return;
  loading.value = true;
  await nextTick();
  try {
    report.value = buildReport(source.value, config);
    appliedConfig.value = config;
    lastSignature.value = signature;
    await router.replace({ query: { report: config.reportType, period: config.datePreset, ...config.filters } });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Report unavailable', detail: error.message, life: 4000 });
  } finally {
    loading.value = false;
  }
}

function resetReport(value) {
  configModel.value = value;
  runReport(value, true);
}

function exportCsv() {
  if (!report.value?.rows?.length) return;
  downloadReportCsv(report.value, appliedConfig.value);
  toast.add({ severity: 'success', summary: 'CSV exported', detail: `${report.value.rows.length} filtered rows exported.`, life: 2600 });
}

function handleTableAction(action, row) {
  if (action === 'view') router.push(`/members/${row.id}`);
  if (action === 'renew') router.push(`/members/${row.id}?action=renew`);
  if (action === 'payment') router.push(`/members/${row.id}?action=payment`);
  if (action === 'message') router.push({ path: '/messages', query: { compose: '1', memberId: row.id } });
}

watch(() => gymStore.dataLoaded, (loaded) => { if (loaded) runReport(configModel.value, true); });
watch(defaultType, (value) => {
  if (!availableReports.value.some((item) => item.value === configModel.value.reportType)) {
    configModel.value = { ...configModel.value, reportType: value };
    runReport(configModel.value, true);
  }
});
onMounted(() => runReport(configModel.value, true));
</script>

<template>
  <section class="reports-workspace stack-16">
    <PageHeader title="Reports" subtitle="Understand your gym's performance and member activity.">
      <template #actions>
        <Button label="Print Report" icon="pi pi-print" severity="secondary" outlined :disabled="!report" @click="window.print()" />
        <Button label="Export CSV" icon="pi pi-download" :disabled="!report?.rows?.length" @click="exportCsv" />
      </template>
    </PageHeader>

    <ReportFilterBar
      v-model="configModel"
      :report-definitions="availableReports"
      :members="gymStore.membersDetailed"
      :trainers="gymStore.trainers"
      :plans="gymStore.membershipPlans"
      @apply="runReport"
      @reset="resetReport"
    />

    <div v-if="report" class="report-output print-zone">
      <div class="report-output__heading">
        <div><p class="report-output__eyebrow">{{ periodLabel }}</p><h2>{{ report.title }}</h2><p>{{ report.subtitle }}</p></div>
        <span class="report-output__count">{{ report.rows.length }} records</span>
      </div>

      <div v-if="report.notice" class="report-notice"><i class="pi pi-info-circle" /><span>{{ report.notice }}</span></div>

      <div class="report-stat-grid" :aria-busy="loading">
        <ReportStatCard v-for="metric in report.kpis" :key="metric.label" :metric="metric" />
      </div>

      <section v-if="report.profile" class="report-member-profile">
        <MemberAvatar :name="report.profile.fullName" size="lg" />
        <div><p class="report-output__eyebrow">Member Attendance</p><h3>{{ report.profile.fullName }}</h3><p>{{ report.profile.memberCode }} | {{ report.profile.mobile }}</p></div>
        <div><span>Current Membership</span><strong>{{ report.profile.membershipPlanName }}</strong></div>
        <div><span>Membership Period</span><strong>{{ profileMembership ? `${formatDate(profileMembership.startDate)} - ${formatDate(profileMembership.endDate)}` : '--' }}</strong></div>
        <StatusBadge :status="report.profile.membershipStatus" />
      </section>

      <div v-if="report.charts.length" class="report-chart-grid">
        <ReportChart v-for="item in report.charts" :key="item.title" :chart="item" />
      </div>

      <section class="report-details">
        <div class="report-details__head"><div><p class="report-output__eyebrow">Filtered detail</p><h2>Detailed Data</h2></div><Button label="Export CSV" icon="pi pi-download" text :disabled="!report.rows.length" @click="exportCsv" /></div>
        <ReportTable :columns="report.columns" :rows="report.rows" :loading="loading" :actions="report.actions" @action="handleTableAction" />
      </section>
    </div>
  </section>
</template>