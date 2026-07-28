<script setup>
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

import { formatCurrency, formatDate } from '../../utils/formatters';

defineProps({
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
          <h3>GymPulse Fitness Club</h3>
          <p>Balewadi High Street, Pune, Maharashtra</p>
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
        <p><strong>Payment Mode:</strong> {{ receipt.paymentMode }}</p>
      </div>

      <div class="receipt-amount">
        <p><span>Amount Paid</span><strong>{{ formatCurrency(receipt.amount) }}</strong></p>
        <p>
          <span>Outstanding</span>
          <strong>{{ formatCurrency(receipt.outstandingBalance || 0) }}</strong>
        </p>
      </div>

      <div class="receipt-actions no-print">
        <Button type="button" label="Print Receipt" icon="pi pi-print" @click="printReceipt" />
      </div>
    </div>
  </Dialog>
</template>
