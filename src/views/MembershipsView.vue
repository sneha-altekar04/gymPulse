<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';

import EmptyState from '../components/common/EmptyState.vue';
import PageHeader from '../components/common/PageHeader.vue';
import RenewMembershipDialog from '../components/members/RenewMembershipDialog.vue';
import StatCard from '../components/common/StatCard.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import { useGymStore } from '../stores/gymStore';
import { formatCurrency, formatDate } from '../utils/formatters';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const gymStore = useGymStore();

const searchText = ref('');
const selectedStatus = ref(typeof route.query.status === 'string' ? route.query.status : 'ALL');
const selectedPlan = ref('ALL');
const selectedExpiry = ref('ALL');

const renewVisible = ref(false);
const activeMember = ref(null);

const statusOptions = ['ALL', 'ACTIVE', 'EXPIRING SOON', 'EXPIRED'];
const expiryOptions = [
  { label: 'All Expiry', value: 'ALL' },
  { label: 'Next 7 days', value: '7_DAYS' },
  { label: 'Next 30 days', value: '30_DAYS' },
  { label: 'Already Expired', value: 'OVERDUE' }
];

const planOptions = computed(() => [
  { label: 'All Plans', value: 'ALL' },
  ...gymStore.membershipPlans.map((plan) => ({ label: plan.name, value: plan.name }))
]);

const kpis = computed(() => {
  const records = gymStore.membershipsDetailed;
  return {
    active: records.filter((item) => item.daysRemaining >= 8).length,
    expiringSoon: records.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 7).length,
    expired: records.filter((item) => item.daysRemaining < 0).length,
    renewalsMonth: records.filter((item) => {
      const start = new Date(item.startDate);
      const now = new Date();
      return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
    }).length
  };
});

const filteredMemberships = computed(() => {
  const search = searchText.value.trim().toLowerCase();

  return gymStore.membershipsDetailed.filter((record) => {
    const derivedStatus =
      record.daysRemaining < 0 ? 'EXPIRED' : record.daysRemaining <= 7 ? 'EXPIRING SOON' : 'ACTIVE';

    const searchMatch =
      !search ||
      record.memberName.toLowerCase().includes(search) ||
      record.memberCode.toLowerCase().includes(search);

    const statusMatch = selectedStatus.value === 'ALL' || selectedStatus.value === derivedStatus;
    const planMatch = selectedPlan.value === 'ALL' || selectedPlan.value === record.planName;

    let expiryMatch = true;
    if (selectedExpiry.value === '7_DAYS') {
      expiryMatch = record.daysRemaining >= 0 && record.daysRemaining <= 7;
    }
    if (selectedExpiry.value === '30_DAYS') {
      expiryMatch = record.daysRemaining >= 0 && record.daysRemaining <= 30;
    }
    if (selectedExpiry.value === 'OVERDUE') {
      expiryMatch = record.daysRemaining < 0;
    }

    return searchMatch && statusMatch && planMatch && expiryMatch;
  });
});

function clearFilters() {
  searchText.value = '';
  selectedStatus.value = 'ALL';
  selectedPlan.value = 'ALL';
  selectedExpiry.value = 'ALL';
}

function openRenew(record) {
  activeMember.value = gymStore.getMemberById(record.memberId);
  renewVisible.value = true;
}

function renewMembership(payload) {
  gymStore.renewMembership(payload);
  toast.add({
    severity: 'success',
    summary: 'Membership renewed',
    detail: 'Renewal saved as a new membership record.',
    life: 2600
  });
}
</script>

<template>
  <section class="stack-16">
    <PageHeader title="Memberships" subtitle="Track active and historical membership records">
      <template #actions>
        <Button label="Membership Plans" icon="pi pi-list" severity="secondary" @click="router.push('/memberships/plans')" />
      </template>
    </PageHeader>

    <div class="dashboard-grid-kpis">
      <StatCard title="Active Memberships" :value="kpis.active" helper="Healthy member coverage" icon="pi pi-check-circle" tone="success" />
      <StatCard title="Expiring Soon" :value="kpis.expiringSoon" helper="Renew in next 7 days" icon="pi pi-exclamation-circle" tone="warning" />
      <StatCard title="Expired" :value="kpis.expired" helper="Require immediate follow-up" icon="pi pi-times-circle" tone="danger" />
      <StatCard title="Renewals This Month" :value="kpis.renewalsMonth" helper="Fresh renewals completed" icon="pi pi-refresh" tone="accent" />
    </div>

    <div class="panel-card stack-16">
      <div class="toolbar-grid">
        <span class="p-input-icon-left">
          <i class="pi pi-search" />
          <InputText v-model="searchText" placeholder="Search member" />
        </span>
        <Dropdown v-model="selectedStatus" :options="statusOptions" />
        <Dropdown v-model="selectedPlan" :options="planOptions" option-label="label" option-value="value" />
        <Dropdown v-model="selectedExpiry" :options="expiryOptions" option-label="label" option-value="value" />
        <Button label="Clear Filters" text @click="clearFilters" />
      </div>

      <div v-if="filteredMemberships.length" class="app-table-wrap">
        <table class="app-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Plan</th>
              <th>Start Date</th>
              <th>Expiry Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in filteredMemberships" :key="record.id">
              <td>{{ record.memberName }}</td>
              <td>{{ record.planName }}</td>
              <td>{{ formatDate(record.startDate) }}</td>
              <td>{{ formatDate(record.endDate) }}</td>
              <td>{{ formatCurrency(record.finalAmount) }}</td>
              <td>
                <StatusBadge
                  :status="record.daysRemaining < 0 ? 'EXPIRED' : record.daysRemaining <= 7 ? 'EXPIRING SOON' : 'ACTIVE'"
                />
              </td>
              <td class="table-actions">
                <Button icon="pi pi-user" text @click="router.push(`/members/${record.memberId}`)" />
                <Button icon="pi pi-refresh" text @click="openRenew(record)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <EmptyState
        v-else
        title="No memberships match your current filters."
        description="Try broadening filters or clearing search criteria."
        action-label="Clear Filters"
        @action="clearFilters"
      />
    </div>

    <RenewMembershipDialog
      v-model:visible="renewVisible"
      :member="activeMember"
      :plans="gymStore.membershipPlans.filter((plan) => plan.active)"
      @submit="renewMembership"
    />
  </section>
</template>