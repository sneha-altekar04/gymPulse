<script setup>
import { computed, reactive, watch } from 'vue';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';

import { PAYMENT_METHOD } from '../../constants/domain';
import { formatCurrency, toInputDate } from '../../utils/formatters';
import { allocatePayment } from '../../utils/purchaseCalculations';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  members: {
    type: Array,
    default: () => []
  },
  defaultMemberId: {
    type: String,
    default: ''
  },
  defaultAmount: {
    type: Number,
    default: 0
  },
  showReceipt: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:visible', 'submit']);

const paymentModes = [
  { label: 'Cash', value: PAYMENT_METHOD.CASH },
  { label: 'UPI', value: PAYMENT_METHOD.UPI },
  { label: 'Card', value: PAYMENT_METHOD.CARD },
  { label: 'Bank Transfer', value: PAYMENT_METHOD.BANK_TRANSFER }
];

const form = reactive({
  memberId: '',
  amount: 0,
  paymentMode: PAYMENT_METHOD.CASH,
  paymentDate: toInputDate(),
  notes: ''
});

watch(
  () => props.visible,
  (value) => {
    if (value) {
      form.memberId = props.defaultMemberId || '';
      form.amount = Number(props.defaultAmount || 0);
      form.paymentMode = PAYMENT_METHOD.CASH;
      form.paymentDate = toInputDate();
      form.notes = '';
    }
  }
);

const selectedMember = computed(() => props.members.find((member) => member.id === form.memberId) || null);

const selectedMembership = computed(() => selectedMember.value?.latestMembership || null);
const membershipAmount = computed(() => Number(selectedMembership.value?.finalAmount ?? selectedMembership.value?.membershipAmount ?? 0));
const membershipPaid = computed(() => Number(selectedMembership.value?.membershipAmountPaid ?? selectedMembership.value?.amountPaid ?? 0));
const membershipOutstanding = computed(() => Number(selectedMember.value?.membershipOutstanding ?? Math.max(membershipAmount.value - membershipPaid.value, 0)));
const personalTrainingOutstanding = computed(() => Number(selectedMember.value?.personalTrainingOutstanding || 0));
const outstandingBalance = computed(() => Number(selectedMember.value?.outstandingBalance ?? membershipOutstanding.value + personalTrainingOutstanding.value));
const paymentAllocation = computed(() => allocatePayment(form.amount, membershipOutstanding.value, personalTrainingOutstanding.value));
const canSubmit = computed(() => {
  return (
    selectedMember.value &&
    selectedMembership.value &&
    Number(form.amount) > 0 &&
    Number(form.amount) <= outstandingBalance.value
  );
});

const memberOptions = computed(() =>
  props.members.map((member) => ({
    label: `${member.fullName} (${member.memberCode})`,
    value: member.id
  }))
);

function close() {
  emit('update:visible', false);
}

function submit() {
  if (!canSubmit.value) {
    return;
  }

  emit('submit', {
    memberId: form.memberId,
    membershipId: selectedMembership.value.id,
    amount: Number(form.amount),
    paymentMode: form.paymentMode,
    paymentDate: form.paymentDate,
    notes: form.notes,
    showReceipt: props.showReceipt
  });

  close();
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Record Payment"
    :style="{ width: 'min(700px, 95vw)' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="stack-16">
      <label class="app-field">
        <span>Select Member</span>
        <Dropdown
          v-model="form.memberId"
          :options="memberOptions"
          option-label="label"
          option-value="value"
          filter
          placeholder="Search member"
        />
      </label>

      <div v-if="selectedMember && selectedMembership" class="summary-bar">
        <div class="record-payment-summary">
          <div class="record-payment-summary__head">
            <div>
              <strong>{{ selectedMember.fullName }}</strong>
              <p>{{ selectedMember.memberCode }} · {{ selectedMember.membershipPlanName }}</p>
            </div>
            <span class="record-payment-summary__total">{{ formatCurrency(outstandingBalance) }} due</span>
          </div>

          <div class="record-payment-summary__grid">
            <div>
              <span>Membership Amount</span>
              <strong>{{ formatCurrency(membershipAmount) }}</strong>
            </div>
            <div>
              <span>Paid So Far</span>
              <strong>{{ formatCurrency(membershipPaid) }}</strong>
            </div>
            <div>
              <span>Outstanding Membership</span>
              <strong>{{ formatCurrency(membershipOutstanding) }}</strong>
            </div>
            <div>
              <span>Outstanding PT</span>
              <strong>{{ formatCurrency(personalTrainingOutstanding) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="app-form-grid app-form-grid--two">
        <label class="app-field">
          <span>Amount</span>
          <InputNumber v-model="form.amount" mode="currency" currency="INR" locale="en-IN" :min="0" />
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

        <label class="app-field">
          <span>Payment Date</span>
          <Calendar v-model="form.paymentDate" date-format="yy-mm-dd" show-icon manual-input />
        </label>

        <label class="app-field app-field--full">
          <span>Notes (optional)</span>
          <Textarea v-model="form.notes" rows="2" auto-resize />
        </label>
      </div>

      <div v-if="selectedMember && Number(form.amount) > 0" class="payment-breakdown payment-breakdown--compact">
        <p><span>Allocated to Membership</span><strong>{{ formatCurrency(paymentAllocation.membershipAmount) }}</strong></p>
        <p class="payment-breakdown__pt"><span>Allocated to Personal Training</span><strong>{{ formatCurrency(paymentAllocation.personalTrainingAmount) }}</strong></p>
      </div>

      <div class="form-actions">
        <Button type="button" label="Cancel" severity="secondary" outlined @click="close" />
        <Button type="button" label="Save Payment" :disabled="!canSubmit" @click="submit" />
      </div>
    </div>
  </Dialog>
</template>
