<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import { useToast } from 'primevue/usetoast';

import EmptyState from '../components/common/EmptyState.vue';
import PageHeader from '../components/common/PageHeader.vue';
import RecordPaymentDialog from '../components/payments/RecordPaymentDialog.vue';
import ReceiptDialog from '../components/payments/ReceiptDialog.vue';
import StatCard from '../components/common/StatCard.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import { useGymStore } from '../stores/gymStore';
import { formatCurrency, formatDate, toInputDate } from '../utils/formatters';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const gymStore = useGymStore();

const recordDialogVisible = ref(false);
const receiptDialogVisible = ref(false);
const activeReceipt = ref(null);

const fromDate = ref('');
const toDate = ref('');
const memberFilter = ref('ALL');
const modeFilter = ref('ALL');
const statusFilter = ref(typeof route.query.status === 'string' ? route.query.status : 'ALL');

const modeOptions = ['ALL', 'CASH', 'UPI', 'CARD', 'BANK_TRANSFER'];
const statusOptions = ['ALL', 'PAID', 'PARTIAL', 'PENDING', 'REFUNDED'];

const memberOptions = computed(() => [
  { label: 'All Members', value: 'ALL' },
  ...gymStore.membersDetailed.map((member) => ({ label: member.fullName, value: member.id }))
]);

const filteredPayments = computed(() => {
  return gymStore.paymentsDetailed.filter((entry) => {
    const paymentDate = new Date(entry.paymentDate);
    const startMatch = !fromDate.value || paymentDate >= new Date(fromDate.value);
    const endMatch = !toDate.value || paymentDate <= new Date(toDate.value);
    const memberMatch = memberFilter.value === 'ALL' || entry.memberId === memberFilter.value;
    const modeMatch = modeFilter.value === 'ALL' || entry.paymentMode === modeFilter.value;
    const statusMatch =
      statusFilter.value === 'ALL' ||
      entry.status === statusFilter.value ||
      (statusFilter.value === 'PENDING' && entry.status === 'PARTIAL');

    return startMatch && endMatch && memberMatch && modeMatch && statusMatch;
  });
});

const paymentKpis = computed(() => {
  const today = toInputDate();
  const todayAmount = gymStore.paymentsDetailed
    .filter((entry) => entry.paymentDate === today)
    .reduce((sum, entry) => sum + entry.amount, 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthAmount = gymStore.paymentsDetailed
    .filter((entry) => {
      const date = new Date(entry.paymentDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, entry) => sum + entry.amount, 0);

  return {
    collectionToday: todayAmount,
    collectionMonth: monthAmount,
    pendingAmount: gymStore.dashboardStats.totalPendingAmount
  };
});

function clearFilters() {
  fromDate.value = '';
  toDate.value = '';
  memberFilter.value = 'ALL';
  modeFilter.value = 'ALL';
  statusFilter.value = 'ALL';
}

function recordPayment(payload) {
  const receipt = gymStore.recordPayment(payload);
  toast.add({ severity: 'success', summary: 'Payment recorded', life: 2400 });
  if (receipt) {
    activeReceipt.value = gymStore.paymentsDetailed.find((entry) => entry.id === receipt.id) || null;
    receiptDialogVisible.value = true;
  }
}

function viewReceipt(payment) {
  activeReceipt.value = payment;
  receiptDialogVisible.value = true;
}
</script>

<template>
  <section class="stack-16">
    <PageHeader title="Payments" subtitle="Track collections, pending balances, and receipts">
      <template #actions>
        <Button label="Record Payment" icon="pi pi-plus" @click="recordDialogVisible = true" />
      </template>
    </PageHeader>

    <div class="dashboard-grid-kpis">
      <StatCard title="Collection Today" :value="paymentKpis.collectionToday" helper="Payments received today" icon="pi pi-calendar" tone="primary" format="currency" />
      <StatCard title="Collection This Month" :value="paymentKpis.collectionMonth" helper="Monthly collection trend" icon="pi pi-wallet" tone="success" format="currency" />
      <StatCard title="Pending Amount" :value="paymentKpis.pendingAmount" helper="Outstanding member balances" icon="pi pi-clock" tone="warning" format="currency" />
      <StatCard title="Recorded Receipts" :value="gymStore.paymentsDetailed.length" helper="All payment entries" icon="pi pi-receipt" tone="accent" />
    </div>

    <div class="panel-card stack-16">
      <div class="toolbar-grid">
        <Calendar v-model="fromDate" date-format="yy-mm-dd" show-icon manual-input placeholder="From date" />
        <Calendar v-model="toDate" date-format="yy-mm-dd" show-icon manual-input placeholder="To date" />
        <Dropdown v-model="memberFilter" :options="memberOptions" option-label="label" option-value="value" />
        <Dropdown v-model="modeFilter" :options="modeOptions" />
        <Dropdown v-model="statusFilter" :options="statusOptions" />
        <Button label="Clear Filters" text @click="clearFilters" />
      </div>

      <div v-if="filteredPayments.length" class="app-table-wrap">
        <table class="app-table">
          <thead>
            <tr>
              <th>Receipt Number</th>
              <th>Member</th>
              <th>Date</th>
              <th>Membership</th>
              <th>Amount</th>
              <th>Payment Mode</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in filteredPayments" :key="payment.id">
              <td>{{ payment.receiptNumber }}</td>
              <td>{{ payment.memberName }}</td>
              <td>{{ formatDate(payment.paymentDate) }}</td>
              <td>{{ payment.membershipPlanName }}</td>
              <td>{{ formatCurrency(payment.amount) }}</td>
              <td>{{ payment.paymentMode }}</td>
              <td><StatusBadge :status="payment.status" /></td>
              <td class="table-actions">
                <Button icon="pi pi-file" text @click="viewReceipt(payment)" />
                <Button icon="pi pi-user" text @click="router.push(`/members/${payment.memberId}`)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <EmptyState
        v-else
        title="No payments match your filters."
        description="Adjust date range or payment filters to see records."
        action-label="Clear Filters"
        @action="clearFilters"
      />
    </div>

    <RecordPaymentDialog
      v-model:visible="recordDialogVisible"
      :members="gymStore.membersDetailed"
      @submit="recordPayment"
    />

    <ReceiptDialog v-model:visible="receiptDialogVisible" :receipt="activeReceipt" />
  </section>
</template>