<script setup>
import { computed, reactive, watch } from 'vue';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';

import { PAYMENT_METHOD } from '../../constants/domain';
import { formatCurrency, formatDate, toInputDate } from '../../utils/formatters';
import { calculatePurchaseTotals, calculateSubscriptionEndDate } from '../../utils/purchaseCalculations';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  member: {
    type: Object,
    default: null
  },
  plans: {
    type: Array,
    default: () => []
  },
  personalTrainingPlans: {
    type: Array,
    default: () => []
  },
  trainers: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:visible', 'submit']);

const form = reactive({
  planId: '',
  startDate: toInputDate(),
  personalTrainingMode: 'NONE',
  personalTrainingPlanId: '',
  personalTrainerId: '',
  personalTrainingStartDate: toInputDate(),
  discount: 0,
  amountPaid: 0,
  paymentMode: PAYMENT_METHOD.CASH
});

const paymentModes = [
  { label: 'Cash', value: PAYMENT_METHOD.CASH },
  { label: 'UPI', value: PAYMENT_METHOD.UPI },
  { label: 'Card', value: PAYMENT_METHOD.CARD },
  { label: 'Bank Transfer', value: PAYMENT_METHOD.BANK_TRANSFER }
];

watch(
  () => props.visible,
  (value) => {
    if (value) {
      form.planId = props.member?.latestMembership?.planId || '';
      form.startDate = toInputDate();
      form.discount = 0;
      form.personalTrainingMode = 'NONE';
      form.personalTrainingPlanId = '';
      form.personalTrainerId = '';
      form.personalTrainingStartDate = form.startDate;
      form.amountPaid = 0;
      form.paymentMode = PAYMENT_METHOD.CASH;
    }
  }
);

const selectedPlan = computed(() => props.plans.find((item) => item.id === form.planId) || null);
const planPrice = computed(() => selectedPlan.value?.price || 0);
const selectedPersonalTrainingPlan = computed(() => props.personalTrainingPlans.find((item) => item.id === form.personalTrainingPlanId) || null);
const personalTrainingPrice = computed(() => form.personalTrainingMode === 'NEW' ? Number(selectedPersonalTrainingPlan.value?.price || 0) : 0);
const totals = computed(() => calculatePurchaseTotals({ membershipAmount: planPrice.value, personalTrainingAmount: personalTrainingPrice.value, discount: form.discount, amountPaid: form.amountPaid }));
const personalTrainingModes = computed(() => [
  { label: 'No PT', value: 'NONE' },
  ...(props.member?.activePersonalTraining ? [{ label: 'Continue Existing PT', value: 'CONTINUE' }] : []),
  { label: 'New PT Plan', value: 'NEW' }
]);
const newExpiryDate = computed(() => {
  if (!selectedPlan.value || !form.startDate) {
    return null;
  }

  return calculateSubscriptionEndDate(toInputDate(form.startDate), selectedPlan.value.duration, selectedPlan.value.durationUnit);
});

const disableSubmit = computed(() => {
  return (
    !form.planId ||
    !form.startDate ||
    Number(form.discount) > totals.value.subtotal ||
    Number(form.amountPaid) > totals.value.totalAmount ||
    (form.personalTrainingMode === 'NEW' && (!form.personalTrainingPlanId || !form.personalTrainerId || !form.personalTrainingStartDate))
  );
});

function close() {
  emit('update:visible', false);
}

function submit() {
  if (disableSubmit.value || !props.member) {
    return;
  }

  emit('submit', {
    memberId: props.member.id,
    planId: form.planId,
    startDate: form.startDate,
    personalTrainingMode: form.personalTrainingMode,
    personalTrainingPlanId: form.personalTrainingPlanId,
    personalTrainerId: form.personalTrainerId,
    personalTrainingStartDate: form.personalTrainingStartDate,
    discount: Number(form.discount || 0),
    amountPaid: Number(form.amountPaid || 0),
    paymentMode: form.paymentMode
  });
  close();
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Renew Membership"
    :style="{ width: 'min(720px, 95vw)' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="member" class="stack-16">
      <div class="summary-bar">
        <p>
          <strong>{{ member.fullName }}</strong>
          <span>Current: {{ member.membershipPlanName }}</span>
          <span>Expiry: {{ member.membershipExpiryDate ? formatDate(member.membershipExpiryDate) : '--' }}</span>
        </p>
      </div>

      <div class="app-form-grid app-form-grid--two">
        <label class="app-field">
          <span>New Plan</span>
          <Dropdown
            v-model="form.planId"
            :options="plans"
            option-label="name"
            option-value="id"
            placeholder="Select plan"
          />
        </label>

        <label class="app-field app-field--full"><span>Personal Training</span><Dropdown v-model="form.personalTrainingMode" :options="personalTrainingModes" option-label="label" option-value="value" /></label>
        <template v-if="form.personalTrainingMode === 'NEW'">
          <label class="app-field"><span>PT Plan</span><Dropdown v-model="form.personalTrainingPlanId" :options="personalTrainingPlans" option-label="name" option-value="id" placeholder="Select PT plan" /></label>
          <label class="app-field"><span>Personal Trainer</span><Dropdown v-model="form.personalTrainerId" :options="trainers" option-label="fullName" option-value="id" placeholder="Select active trainer" /></label>
          <label class="app-field"><span>PT Start Date</span><Calendar v-model="form.personalTrainingStartDate" date-format="yy-mm-dd" show-icon manual-input /></label>
        </template>
        <div v-else-if="form.personalTrainingMode === 'CONTINUE'" class="summary-bar app-field--full"><p><strong>{{ member.activePersonalTraining.planName }}</strong><span>Trainer: {{ member.activePersonalTraining.trainerName }}</span><span>Existing dates and charges remain unchanged.</span></p></div>
        <p v-else-if="member.personalTraining?.length && !member.activePersonalTraining" class="app-help app-field--full">Existing Personal Training has expired. Select New PT Plan to add another subscription.</p>

        <label class="app-field">
          <span>Start Date</span>
          <Calendar v-model="form.startDate" date-format="yy-mm-dd" show-icon manual-input />
        </label>

        <label class="app-field">
          <span>Discount</span>
          <InputNumber v-model="form.discount" :min="0" mode="currency" currency="INR" locale="en-IN" />
        </label>

        <label class="app-field">
          <span>Amount Paid</span>
          <InputNumber v-model="form.amountPaid" :min="0" mode="currency" currency="INR" locale="en-IN" />
        </label>

        <label class="app-field">
          <span>Payment Mode</span>
          <Dropdown
            v-model="form.paymentMode"
            :options="paymentModes"
            option-label="label"
            option-value="value"
          />
        </label>

        <div class="app-field">
          <span>Plan Price</span>
          <p class="metric-text">{{ formatCurrency(planPrice) }}</p>
        </div>

        <div class="app-field">
          <span>Final Amount</span>
          <p class="metric-text">{{ formatCurrency(totals.totalAmount) }}</p>
        </div>

        <div class="app-field">
          <span>Pending Amount</span>
          <p class="metric-text">{{ formatCurrency(totals.pendingAmount) }}</p>
        </div>

        <div class="app-field app-field--full" v-if="newExpiryDate">
          <span>New Expiry Date</span>
          <p class="metric-text">{{ formatDate(newExpiryDate) }}</p>
        </div>

        <div class="app-field app-field--full payment-breakdown"><p><span>Membership Charges</span><strong>{{ formatCurrency(totals.membershipAmount) }}</strong></p><p class="payment-breakdown__pt"><span>Personal Training Charges</span><strong>{{ formatCurrency(totals.personalTrainingAmount) }}</strong></p><p><span>Discount</span><strong>- {{ formatCurrency(totals.discount) }}</strong></p><p class="payment-breakdown__total"><span>Total</span><strong>{{ formatCurrency(totals.totalAmount) }}</strong></p></div>
      </div>

      <div class="form-actions">
        <Button type="button" label="Cancel" severity="secondary" outlined @click="close" />
        <Button type="button" label="Renew Membership" :disabled="disableSubmit" @click="submit" />
      </div>
    </div>
  </Dialog>
</template>
