<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import TabPanel from 'primevue/tabpanel';
import TabView from 'primevue/tabview';
import { useToast } from 'primevue/usetoast';

import MemberAvatar from '../components/common/MemberAvatar.vue';
import MessageComposerDialog from '../components/messages/MessageComposerDialog.vue';
import PageHeader from '../components/common/PageHeader.vue';
import RenewMembershipDialog from '../components/members/RenewMembershipDialog.vue';
import RecordPaymentDialog from '../components/payments/RecordPaymentDialog.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import { useGymStore } from '../stores/gymStore';
import { useAuthStore } from '../stores/authStore';
import { getMessageLogs, getMessageTemplates } from '../services/firebase/messageService';
import { formatCurrency, formatDate, formatDateTime, formatDurationFromTimes, formatPaymentMethod, formatTime, daysRemainingFromDate } from '../utils/formatters';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const gymStore = useGymStore();
const authStore = useAuthStore();

const renewVisible = ref(false);
const paymentVisible = ref(false);
const paymentDefaultAmount = ref(0);
const paymentShowReceipt = ref(true);
const messageVisible = ref(false);
const messageLogs = ref([]);
const messageTemplates = ref([]);

const member = computed(() => gymStore.getMemberById(route.params.id));
const memberMemberships = computed(() => gymStore.getMemberMemberships(route.params.id));
const memberAttendance = computed(() => gymStore.getMemberAttendance(route.params.id));
const memberPayments = computed(() => gymStore.getMemberPayments(route.params.id));
const memberPersonalTraining = computed(() => gymStore.getMemberPersonalTraining(route.params.id));

const daysRemaining = computed(() => {
  if (!member.value?.membershipExpiryDate) {
    return null;
  }

  return daysRemainingFromDate(member.value.membershipExpiryDate);
});

const memberOutstandingBalance = computed(() => Number(member.value?.outstandingBalance || 0));

function timestampDate(value) {
  return value?.toDate ? value.toDate() : value;
}

async function loadMessages() {
  if (!authStore.gymId) return;
  try {
    [messageLogs.value, messageTemplates.value] = await Promise.all([
      getMessageLogs(authStore.gymId, { memberId: route.params.id, limit: 50 }),
      getMessageTemplates(authStore.gymId, true)
    ]);
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Message history unavailable', detail: error.message, life: 3500 });
  }
}

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

function completePayment() {
  paymentDefaultAmount.value = memberOutstandingBalance.value;
  paymentShowReceipt.value = false;
  paymentVisible.value = true;
}

async function cancelPersonalTraining(subscription) {
  await gymStore.updatePersonalTrainingStatus(subscription.id, 'CANCELLED');
  toast.add({ severity: 'success', summary: 'Personal Training cancelled', detail: 'The historical PT record remains available.', life: 2800 });
}

onMounted(() => {
  loadMessages();
  if (route.query.action === 'renew') renewVisible.value = true;
  if (route.query.action === 'payment') paymentVisible.value = true;
});
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
          <Button label="Attendance Report" icon="pi pi-chart-line" text @click="router.push({ path: '/reports', query: { report: 'MEMBER_ATTENDANCE', memberId: member.id } })" />
          <Button label="Send Message" icon="pi pi-send" severity="secondary" @click="messageVisible = true" />
          <Button label="Renew Membership" icon="pi pi-refresh" @click="renewVisible = true" />
          <Button label="Record Payment" icon="pi pi-wallet" severity="secondary" @click="completePayment" />
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

      <div v-if="member.activePersonalTraining" class="pt-member-summary">
        <div><p class="panel-card__eyebrow">Personal Training</p><h3>{{ member.activePersonalTraining.planName }}</h3><p>Trainer: {{ member.activePersonalTraining.trainerName }}</p><p>{{ formatDate(member.activePersonalTraining.startDate) }} -> {{ formatDate(member.activePersonalTraining.endDate) }}</p></div>
        <div><strong>{{ formatCurrency(member.activePersonalTraining.amount) }}</strong>&nbsp;&nbsp;&nbsp;&nbsp;<StatusBadge :status="member.activePersonalTraining.status" /><div class="table-actions"><Button label="View Trainer" icon="pi pi-user" text @click="router.push({ path: '/reports', query: { report: 'PT_TRAINER_PERFORMANCE', trainerId: member.activePersonalTraining.trainerId } })" /><Button label="Renew PT" icon="pi pi-refresh" text @click="renewVisible = true" /><Button label="Cancel PT" icon="pi pi-times" text severity="danger" @click="cancelPersonalTraining(member.activePersonalTraining)" /></div></div>
      </div>
      <div v-else class="pt-member-empty"><Button label="Add Personal Training" icon="pi pi-plus" text @click="renewVisible = true" /></div>
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

      <TabPanel header="Personal Training">
        <div v-if="memberPersonalTraining.length" class="app-table-wrap"><table class="app-table"><thead><tr><th>PT Plan</th><th>Trainer</th><th>Start Date</th><th>End Date</th><th>Amount</th><th>Balance</th><th>Status</th></tr></thead><tbody><tr v-for="subscription in memberPersonalTraining" :key="subscription.id"><td>{{ subscription.planName }}</td><td>{{ subscription.trainerName }}</td><td>{{ formatDate(subscription.startDate) }}</td><td>{{ formatDate(subscription.endDate) }}</td><td>{{ formatCurrency(subscription.amount) }}</td><td>{{ formatCurrency(subscription.pendingAmount) }}</td><td><StatusBadge :status="subscription.status" /></td></tr></tbody></table></div>
        <div v-else class="empty-state"><Button label="Add Personal Training" icon="pi pi-plus" @click="renewVisible = true" /></div>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in memberPayments" :key="payment.id">
                <td>{{ payment.receiptNumber }}</td>
                <td>{{ formatDate(payment.paymentDate) }}</td>
                <td>{{ payment.membershipPlanName }}</td>
                <td>{{ formatCurrency(payment.amount) }}</td>
                <td>{{ formatPaymentMethod(payment.paymentMode) }}</td>
                <td><StatusBadge :status="payment.status" /></td>
                <td class="table-actions">
                  <Button
                    v-if="payment.status === 'PARTIAL'"
                    icon="pi pi-check-circle"
                    text
                    aria-label="Complete payment"
                    title="Complete payment"
                    @click="completePayment"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </TabPanel>

      <TabPanel header="Messages">
        <div class="member-tab-head">
          <div><h4>Recent Messages</h4><p>Delivery history for this member.</p></div>
          <Button label="Send Message" icon="pi pi-send" @click="messageVisible = true" />
        </div>
        <div v-if="messageLogs.length" class="app-table-wrap">
          <table class="app-table">
            <thead><tr><th>Message</th><th>Channel</th><th>Sent At</th><th>Status</th></tr></thead>
            <tbody><tr v-for="log in messageLogs" :key="log.id"><td><div class="message-history-content"><strong>{{ log.messageType }}</strong><span>{{ log.content }}</span></div></td><td><i class="pi pi-whatsapp" /> {{ log.channel }}</td><td>{{ log.sentAt ? formatDateTime(timestampDate(log.sentAt)) : '--' }}</td><td><StatusBadge :status="log.status" /></td></tr></tbody>
          </table>
        </div>
        <div v-else class="empty-state"><p>No messages have been sent to this member.</p></div>
      </TabPanel>
    </TabView>

    <RenewMembershipDialog
      v-model:visible="renewVisible"
      :member="member"
      :plans="gymStore.membershipPlans.filter((plan) => plan.active)"
      :personal-training-plans="gymStore.personalTrainingPlans.filter((plan) => plan.status === 'ACTIVE')"
      :trainers="gymStore.trainers.filter((trainer) => trainer.status === 'ACTIVE')"
      @submit="renew"
    />

    <RecordPaymentDialog
      v-model:visible="paymentVisible"
      :members="gymStore.membersDetailed"
      :default-member-id="member.id"
      :default-amount="paymentDefaultAmount"
      :show-receipt="paymentShowReceipt"
      @submit="recordPayment"
    />

    <MessageComposerDialog
      v-model:visible="messageVisible"
      :members="gymStore.membersDetailed"
      :templates="messageTemplates"
      :initial-member-id="member.id"
      :gym-name="authStore.userProfile?.gymName || 'Your Gym'"
      :gym-phone="authStore.userProfile?.gymPhone || '--'"
      @sent="loadMessages"
    />
  </section>
</template>
