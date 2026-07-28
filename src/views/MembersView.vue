<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Menu from 'primevue/menu';
import Paginator from 'primevue/paginator';
import { useToast } from 'primevue/usetoast';

import EmptyState from '../components/common/EmptyState.vue';
import MemberAvatar from '../components/common/MemberAvatar.vue';
import PageHeader from '../components/common/PageHeader.vue';
import RenewMembershipDialog from '../components/members/RenewMembershipDialog.vue';
import RecordPaymentDialog from '../components/payments/RecordPaymentDialog.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import { MEMBER_STATUS } from '../constants/domain';
import { useGymStore } from '../stores/gymStore';
import { formatDate } from '../utils/formatters';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const gymStore = useGymStore();

const searchText = ref('');
const initialStatus =
  typeof route.query.status === 'string' && Object.values(MEMBER_STATUS).includes(route.query.status)
    ? route.query.status
    : MEMBER_STATUS.ALL;

const selectedStatus = ref(initialStatus);
const selectedPlan = ref('ALL');
const selectedTrainer = ref('ALL');

const page = ref(0);
const rows = ref(8);

const renewVisible = ref(false);
const paymentVisible = ref(false);
const activeMember = ref(null);

const actionMenu = ref(null);

const statusOptions = [
  { label: 'ALL', value: MEMBER_STATUS.ALL },
  { label: 'ACTIVE', value: MEMBER_STATUS.ACTIVE },
  { label: 'EXPIRING SOON', value: MEMBER_STATUS.EXPIRING_SOON },
  { label: 'EXPIRED', value: MEMBER_STATUS.EXPIRED },
  { label: 'INACTIVE', value: MEMBER_STATUS.INACTIVE }
];

const planOptions = computed(() => [
  { label: 'All Plans', value: 'ALL' },
  ...gymStore.membershipPlans.map((plan) => ({ label: plan.name, value: plan.name }))
]);

const trainerOptions = computed(() => [
  { label: 'All Trainers', value: 'ALL' },
  ...gymStore.trainers.map((trainer) => ({ label: trainer.fullName, value: trainer.fullName }))
]);

const actionItems = computed(() => [
  {
    label: 'View Details',
    icon: 'pi pi-eye',
    command: () => activeMember.value && router.push(`/members/${activeMember.value.id}`)
  },
  {
    label: 'Edit Member',
    icon: 'pi pi-pencil',
    command: () => activeMember.value && router.push(`/members/${activeMember.value.id}/edit`)
  },
  {
    label: 'Renew Membership',
    icon: 'pi pi-refresh',
    command: () => {
      if (activeMember.value) {
        renewVisible.value = true;
      }
    }
  },
  {
    label: 'Record Payment',
    icon: 'pi pi-wallet',
    command: () => {
      if (activeMember.value) {
        paymentVisible.value = true;
      }
    }
  }
]);

const filteredMembers = computed(() => {
  const search = searchText.value.trim().toLowerCase();

  return gymStore.membersDetailed.filter((member) => {
    const matchesSearch =
      !search ||
      member.fullName.toLowerCase().includes(search) ||
      member.mobile.includes(search) ||
      member.memberCode.toLowerCase().includes(search);

    const matchesStatus =
      selectedStatus.value === MEMBER_STATUS.ALL || member.membershipStatus === selectedStatus.value;

    const matchesPlan =
      selectedPlan.value === 'ALL' || member.membershipPlanName === selectedPlan.value;

    const matchesTrainer =
      selectedTrainer.value === 'ALL' || member.trainerName === selectedTrainer.value;

    return matchesSearch && matchesStatus && matchesPlan && matchesTrainer;
  });
});

const pagedMembers = computed(() => {
  const start = page.value * rows.value;
  return filteredMembers.value.slice(start, start + rows.value);
});

const memberSummary = computed(() => {
  const total = gymStore.membersDetailed.length;
  const active = gymStore.membersDetailed.filter(
    (member) => member.membershipStatus === MEMBER_STATUS.ACTIVE
  ).length;
  const expiring = gymStore.membersDetailed.filter(
    (member) => member.membershipStatus === MEMBER_STATUS.EXPIRING_SOON
  ).length;
  const inactive = gymStore.membersDetailed.filter(
    (member) => member.membershipStatus === MEMBER_STATUS.INACTIVE
  ).length;

  return [
    { id: 'total', label: 'Total Members', value: total, tone: 'violet' },
    { id: 'active', label: 'Active', value: active, tone: 'teal' },
    { id: 'expiring', label: 'Expiring', value: expiring, tone: 'amber' },
    { id: 'inactive', label: 'Inactive', value: inactive, tone: 'coral' }
  ];
});

function openActionMenu(event, member) {
  activeMember.value = member;
  actionMenu.value.toggle(event);
}

function clearFilters() {
  searchText.value = '';
  selectedStatus.value = MEMBER_STATUS.ALL;
  selectedPlan.value = 'ALL';
  selectedTrainer.value = 'ALL';
  page.value = 0;
}

function onPageChange(event) {
  page.value = event.page;
  rows.value = event.rows;
}

function onRenew(payload) {
  gymStore.renewMembership(payload);
  toast.add({
    severity: 'success',
    summary: 'Membership renewed',
    detail: 'A new membership record has been created successfully.',
    life: 2600
  });
}

function onRecordPayment(payload) {
  gymStore.recordPayment(payload);
  toast.add({
    severity: 'success',
    summary: 'Payment recorded',
    detail: 'Member payment has been captured in the receipt log.',
    life: 2600
  });
}
</script>

<template>
  <section class="stack-16 module-members">
    <PageHeader title="Members" subtitle="Manage your gym community and memberships.">
      <template #actions>
        <Button label="Add Member" icon="pi pi-plus" @click="router.push('/members/new')" />
      </template>
    </PageHeader>

    <div class="module-summary-row">
      <article
        v-for="item in memberSummary"
        :key="item.id"
        class="module-summary-card"
        :class="`module-summary-card--${item.tone}`"
      >
        <p class="module-summary-card__label">{{ item.label }}</p>
        <p class="module-summary-card__value">{{ item.value }}</p>
      </article>
    </div>

    <div class="toolbar-grid toolbar-grid--open">
      <span class="p-input-icon-left">
        <i class="pi pi-search" />
        <InputText v-model="searchText" placeholder="Search by name, mobile, member ID" class="w-full" />
      </span>

      <Dropdown v-model="selectedStatus" :options="statusOptions" option-label="label" option-value="value" />
      <Dropdown v-model="selectedPlan" :options="planOptions" option-label="label" option-value="value" />
      <Dropdown
        v-model="selectedTrainer"
        :options="trainerOptions"
        option-label="label"
        option-value="value"
      />

      <Button label="Clear Filters" text @click="clearFilters" />
    </div>

    <div v-if="pagedMembers.length" class="app-table-wrap app-table-wrap--open">
      <table class="app-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Member ID</th>
            <th>Name</th>
            <th>Mobile</th>
            <th>Membership</th>
            <th>Expiry Date</th>
            <th>Trainer</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="member in pagedMembers"
            :key="member.id"
            class="app-table__row-click"
            @click="router.push(`/members/${member.id}`)"
          >
            <td><MemberAvatar :name="member.fullName" /></td>
            <td>{{ member.memberCode }}</td>
            <td class="link-text">{{ member.fullName }}</td>
            <td>{{ member.mobile }}</td>
            <td>{{ member.membershipPlanName }}</td>
            <td>{{ member.membershipExpiryDate ? formatDate(member.membershipExpiryDate) : '--' }}</td>
            <td>{{ member.trainerName }}</td>
            <td><StatusBadge :status="member.membershipStatus" /></td>
            <td>
              <Button
                icon="pi pi-ellipsis-v"
                text
                rounded
                @click.stop="openActionMenu($event, member)"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <Paginator
        :rows="rows"
        :total-records="filteredMembers.length"
        :first="page * rows"
        :rows-per-page-options="[5, 8, 10]"
        @page="onPageChange"
      />
    </div>

    <EmptyState
      v-else
      title="No members match your current search and filters."
      description="Try adjusting one or more filters to find the right member records."
      action-label="Clear Filters"
      @action="clearFilters"
    />

    <Menu ref="actionMenu" :model="actionItems" popup />

    <RenewMembershipDialog
      v-model:visible="renewVisible"
      :member="activeMember"
      :plans="gymStore.membershipPlans.filter((plan) => plan.active)"
      @submit="onRenew"
    />

    <RecordPaymentDialog
      v-model:visible="paymentVisible"
      :members="gymStore.membersDetailed"
      :default-member-id="activeMember?.id || ''"
      @submit="onRecordPayment"
    />
  </section>
</template>
