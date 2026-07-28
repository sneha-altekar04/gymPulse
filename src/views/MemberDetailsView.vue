<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import TabPanel from 'primevue/tabpanel';
import TabView from 'primevue/tabview';
import { useToast } from 'primevue/usetoast';

import MemberAvatar from '../components/common/MemberAvatar.vue';
import PageHeader from '../components/common/PageHeader.vue';
import RenewMembershipDialog from '../components/members/RenewMembershipDialog.vue';
import RecordPaymentDialog from '../components/payments/RecordPaymentDialog.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import { useGymStore } from '../stores/gymStore';
import { formatCurrency, formatDate, formatDurationFromTimes, formatTime, daysRemainingFromDate } from '../utils/formatters';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const gymStore = useGymStore();

const renewVisible = ref(false);
const paymentVisible = ref(false);

const member = computed(() => gymStore.getMemberById(route.params.id));
const memberMemberships = computed(() => gymStore.getMemberMemberships(route.params.id));
const memberAttendance = computed(() => gymStore.getMemberAttendance(route.params.id));
const memberPayments = computed(() => gymStore.getMemberPayments(route.params.id));

const daysRemaining = computed(() => {
  if (!member.value?.membershipExpiryDate) {
    return null;
  }

  return daysRemainingFromDate(member.value.membershipExpiryDate);
});

function renew(payload) {
  gymStore.renewMembership(payload);
  toast.add({
    severity: 'success',
    summary: 'Membership renewed',
    detail: 'Renewal added as a new membership record.',
    life: 2600
  });
}

function recordPayment(payload) {
  gymStore.recordPayment(payload);
  toast.add({
    severity: 'success',
    summary: 'Payment recorded',
    detail: 'Payment entry created and balance updated.',
    life: 2600
  });
}
</script>

<template>
  <section v-if="member" class="stack-16">
    <PageHeader title="Member Details" subtitle="Member profile, attendance, memberships, and payments" />

    <div class="panel-card stack-16">
      <div class="member-profile-top">
        <div class="member-profile-top__identity">
          <MemberAvatar :name="member.fullName" size="lg" />
          <div>
            <h3>{{ member.fullName }}</h3>
            <p>{{ member.memberCode }} | {{ member.mobile }} | {{ member.email || 'No email' }}</p>
            <StatusBadge :status="member.membershipStatus" />
          </div>
        </div>

        <div class="member-profile-top__actions">
          <Button label="Renew Membership" icon="pi pi-refresh" @click="renewVisible = true" />
          <Button label="Record Payment" icon="pi pi-wallet" severity="secondary" @click="paymentVisible = true" />
          <Button label="Edit Member" icon="pi pi-pencil" text @click="router.push(`/members/${member.id}/edit`)" />
        </div>
      </div>

      <div class="membership-highlight">
        <div>
          <p class="panel-card__eyebrow">Current Membership</p>
          <h3>{{ member.membershipPlanName }}</h3>
          <p>
            {{ member.latestMembership ? formatDate(member.latestMembership.startDate) : '--' }}
            ->
            {{ member.membershipExpiryDate ? formatDate(member.membershipExpiryDate) : '--' }}
          </p>
        </div>
        <div>
          <p class="panel-card__eyebrow">Membership State</p>
          <StatusBadge :status="member.membershipStatus" />
          <p v-if="daysRemaining !== null && daysRemaining >= 0">{{ daysRemaining }} days remaining</p>
          <p v-else-if="daysRemaining !== null" class="text-danger">Expired {{ Math.abs(daysRemaining) }} days ago</p>
        </div>
      </div>
    </div>

    <TabView>
      <TabPanel header="Overview">
        <div class="overview-grid">
          <div class="panel-card">
            <h4>Membership Snapshot</h4>
            <p>Joining Date: {{ formatDate(member.joiningDate) }}</p>
            <p>Expiry Date: {{ member.membershipExpiryDate ? formatDate(member.membershipExpiryDate) : '--' }}</p>
            <p>Trainer: {{ member.trainerName }}</p>
            <p>Outstanding Balance: {{ formatCurrency(member.outstandingBalance) }}</p>
          </div>

          <div class="panel-card">
            <h4>Activity</h4>
            <p>Total Visits: {{ member.totalVisits }}</p>
            <p>Visits This Month: {{ member.visitsThisMonth }}</p>
            <p>Last Visit: {{ member.lastVisitAt ? formatDate(member.lastVisitAt) : '--' }}</p>
          </div>

          <div class="panel-card">
            <h4>Contact Information</h4>
            <p>Address: {{ member.address || '--' }}</p>
            <p>Emergency Contact: {{ member.emergencyContactName || '--' }}</p>
            <p>Emergency Number: {{ member.emergencyContactNumber || '--' }}</p>
          </div>
        </div>
      </TabPanel>

      <TabPanel header="Attendance">
        <div class="app-table-wrap">
          <table class="app-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Duration</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in memberAttendance" :key="entry.id">
                <td>{{ formatDate(entry.checkInTime) }}</td>
                <td>{{ formatTime(entry.checkInTime) }}</td>
                <td>{{ entry.checkOutTime ? formatTime(entry.checkOutTime) : '--' }}</td>
                <td>{{ formatDurationFromTimes(entry.checkInTime, entry.checkOutTime) }}</td>
                <td><StatusBadge :status="entry.source" tone="neutral" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </TabPanel>

      <TabPanel header="Membership History">
        <div class="app-table-wrap">
          <table class="app-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in memberMemberships" :key="record.id">
                <td>{{ record.planName }}</td>
                <td>{{ formatDate(record.startDate) }}</td>
                <td>{{ formatDate(record.endDate) }}</td>
                <td>{{ formatCurrency(record.finalAmount) }}</td>
                <td><StatusBadge :status="record.status" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </TabPanel>

      <TabPanel header="Payments">
        <div class="app-table-wrap">
          <table class="app-table">
            <thead>
              <tr>
                <th>Receipt Number</th>
                <th>Date</th>
                <th>Membership</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in memberPayments" :key="payment.id">
                <td>{{ payment.receiptNumber }}</td>
                <td>{{ formatDate(payment.paymentDate) }}</td>
                <td>{{ payment.membershipPlanName }}</td>
                <td>{{ formatCurrency(payment.amount) }}</td>
                <td>{{ payment.paymentMode }}</td>
                <td><StatusBadge :status="payment.status" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </TabPanel>
    </TabView>

    <RenewMembershipDialog
      v-model:visible="renewVisible"
      :member="member"
      :plans="gymStore.membershipPlans.filter((plan) => plan.active)"
      @submit="renew"
    />

    <RecordPaymentDialog
      v-model:visible="paymentVisible"
      :members="gymStore.membersDetailed"
      :default-member-id="member.id"
      @submit="recordPayment"
    />
  </section>
</template>
