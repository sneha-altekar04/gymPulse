<script setup>
import { computed, reactive, watch } from 'vue';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';

import { PAYMENT_METHOD } from '../../constants/domain';
import { formatCurrency, formatDate, toInputDate } from '../../utils/formatters';

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
  }
});

const emit = defineEmits(['update:visible', 'submit']);

const form = reactive({
  planId: '',
  startDate: toInputDate(),
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
      form.amountPaid = 0;
      form.paymentMode = PAYMENT_METHOD.CASH;
    }
  }
);

const selectedPlan = computed(() => props.plans.find((item) => item.id === form.planId) || null);
const planPrice = computed(() => selectedPlan.value?.price || 0);
const finalAmount = computed(() => Math.max(planPrice.value - Number(form.discount || 0), 0));
const pendingAmount = computed(() => Math.max(finalAmount.value - Number(form.amountPaid || 0), 0));
const newExpiryDate = computed(() => {
  if (!selectedPlan.value || !form.startDate) {
    return null;
  }

  const date = new Date(form.startDate);
  date.setDate(date.getDate() + selectedPlan.value.duration - 1);
  return date;
});

const disableSubmit = computed(() => {
  return (
    !form.planId ||
    !form.startDate ||
    Number(form.discount) > planPrice.value ||
    Number(form.amountPaid) > finalAmount.value
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
          <p class="metric-text">{{ formatCurrency(finalAmount) }}</p>
        </div>

        <div class="app-field">
          <span>Pending Amount</span>
          <p class="metric-text">{{ formatCurrency(pendingAmount) }}</p>
        </div>

        <div class="app-field app-field--full" v-if="newExpiryDate">
          <span>New Expiry Date</span>
          <p class="metric-text">{{ formatDate(newExpiryDate) }}</p>
        </div>
      </div>

      <div class="form-actions">
        <Button type="button" label="Cancel" severity="secondary" outlined @click="close" />
        <Button type="button" label="Renew Membership" :disabled="disableSubmit" @click="submit" />
      </div>
    </div>
  </Dialog>
</template>
