<script setup>
import { computed } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

import { formatCurrency, formatDate, formatPaymentMethod } from '../../utils/formatters';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  receipt: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:visible']);

const membershipCharge = computed(() => Number(props.receipt?.membershipChargeAmount ?? props.receipt?.membershipAmount ?? props.receipt?.amount ?? 0));
const personalTrainingCharge = computed(() => Number(props.receipt?.personalTrainingChargeAmount ?? props.receipt?.personalTrainingAmount ?? 0));
const discountAmount = computed(() => Number(props.receipt?.discount || 0));
const totalAmount = computed(() => Number(props.receipt?.totalAmount ?? Math.max(membershipCharge.value + personalTrainingCharge.value - discountAmount.value, 0)));
const amountPaid = computed(() => Number(props.receipt?.amount ?? props.receipt?.amountPaid ?? 0));
const outstandingAmount = computed(() => Math.max(totalAmount.value - amountPaid.value, 0));

function printReceipt() {
  window.print();
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Payment Receipt"
    :style="{ width: 'min(760px, 95vw)' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="receipt" class="receipt-card print-zone">
      <div class="receipt-head">
        <div>
          <h3>K3 Oxygen Gym</h3>
          <p>Fish Market Rd, Ziral Ali, Pen, Maharashtra 402107</p>
        </div>
        <div class="receipt-meta">
          <p><strong>Receipt:</strong> {{ receipt.receiptNumber }}</p>
          <p><strong>Date:</strong> {{ formatDate(receipt.paymentDate) }}</p>
        </div>
      </div>

      <div class="receipt-grid">
        <p><strong>Member:</strong> {{ receipt.memberName }}</p>
        <p><strong>Member ID:</strong> {{ receipt.memberCode }}</p>
        <p><strong>Membership Plan:</strong> {{ receipt.membershipPlanName }}</p>
        <p><strong>Payment Mode:</strong> {{ formatPaymentMethod(receipt.paymentMode) }}</p>
      </div>

      <div class="receipt-amount">
        <p><span>Membership</span><strong>{{ formatCurrency(membershipCharge) }}</strong></p>
        <p v-if="personalTrainingCharge > 0" class="payment-breakdown__pt"><span>Personal Training</span><strong>{{ formatCurrency(personalTrainingCharge) }}</strong></p>
        <p v-if="discountAmount > 0"><span>Discount</span><strong>- {{ formatCurrency(discountAmount) }}</strong></p>
        <p><span>Amount Paid</span><strong>{{ formatCurrency(amountPaid) }}</strong></p>
        <p>
          <span>Outstanding</span>
          <strong>{{ formatCurrency(outstandingAmount) }}</strong>
        </p>
      </div>

      <div class="receipt-actions no-print">
        <Button type="button" label="Print Receipt" icon="pi pi-print" @click="printReceipt" />
      </div>
    </div>
  </Dialog>
</template>
