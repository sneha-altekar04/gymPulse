<script setup>
import { computed, reactive, ref, watch } from 'vue';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';

import { GENDER_OPTIONS, PAYMENT_METHOD } from '../../constants/domain';
import FormSection from '../common/FormSection.vue';
import { formatCurrency, toInputDate } from '../../utils/formatters';
import { calculatePurchaseTotals, calculateSubscriptionEndDate } from '../../utils/purchaseCalculations';

const toast = useToast();
const formRef = ref(null);

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  plans: {
    type: Array,
    default: () => []
  },
  trainers: {
    type: Array,
    default: () => []
  },
  personalTrainingPlans: {
    type: Array,
    default: () => []
  },
  mode: {
    type: String,
    default: 'create'
  },
  saving: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit', 'cancel']);

const paymentModes = [
  { label: 'Cash', value: PAYMENT_METHOD.CASH },
  { label: 'UPI', value: PAYMENT_METHOD.UPI },
  { label: 'Card', value: PAYMENT_METHOD.CARD },
  { label: 'Bank Transfer', value: PAYMENT_METHOD.BANK_TRANSFER }
];

function emptyState() {
  return {
    fullName: '',
    mobile: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    joiningDate: toInputDate(),
    trainerId: '',
    planId: '',
    addPersonalTraining: false,
    personalTrainingPlanId: '',
    personalTrainerId: '',
    personalTrainingStartDate: toInputDate(),
    deviceUserId: '',
    discount: 0,
    amountPaid: 0,
    paymentMode: PAYMENT_METHOD.CASH
  };
}

const form = reactive(emptyState());
const errors = reactive({});

watch(
  () => props.modelValue,
  (value) => {
    Object.assign(form, emptyState(), value || {});
  },
  { immediate: true }
);

const selectedPlan = computed(() => props.plans.find((plan) => plan.id === form.planId) || null);
const planAmount = computed(() => selectedPlan.value?.price || 0);
const selectedPersonalTrainingPlan = computed(() => props.personalTrainingPlans.find((plan) => plan.id === form.personalTrainingPlanId) || null);
const personalTrainingAmount = computed(() => form.addPersonalTraining ? Number(selectedPersonalTrainingPlan.value?.price || 0) : 0);
const purchaseTotals = computed(() => calculatePurchaseTotals({ membershipAmount: planAmount.value, personalTrainingAmount: personalTrainingAmount.value, discount: form.discount, amountPaid: form.amountPaid }));
const personalTrainingEndDate = computed(() => form.addPersonalTraining && selectedPersonalTrainingPlan.value
  ? calculateSubscriptionEndDate(toInputDate(form.personalTrainingStartDate), selectedPersonalTrainingPlan.value.duration, selectedPersonalTrainingPlan.value.durationUnit)
  : '');
const isEditMode = computed(() => props.mode === 'edit');

watch(() => form.addPersonalTraining, (enabled) => {
  if (enabled) {
    if (!form.personalTrainingStartDate) form.personalTrainingStartDate = form.joiningDate || toInputDate();
    return;
  }
  form.personalTrainingPlanId = '';
  form.personalTrainerId = '';
  form.personalTrainingStartDate = form.joiningDate || toInputDate();
});

function validate() {
  Object.keys(errors).forEach((key) => delete errors[key]);

  if (!form.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  }

  if (!/^\d{10}$/.test(form.mobile)) {
    errors.mobile = 'Enter a valid 10-digit mobile number.';
  }

  if (!form.email || !form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!form.joiningDate) {
    errors.joiningDate = 'Joining date is required.';
  }

  if (!isEditMode.value) {
    if (!form.planId) {
      errors.planId = 'Membership plan is required.';
    }

    if (Number(form.discount) > purchaseTotals.value.subtotal) {
      errors.discount = 'Discount cannot exceed the subtotal.';
    }

    if (Number(form.amountPaid) > purchaseTotals.value.totalAmount) {
      errors.amountPaid = 'Amount paid cannot exceed payable amount.';
    }

    if (Number(form.amountPaid) > 0 && !form.paymentMode) {
      errors.paymentMode = 'Select payment mode for paid amount.';
    }

    if (form.addPersonalTraining) {
      if (!form.personalTrainingPlanId) errors.personalTrainingPlanId = 'Personal Training plan is required.';
      if (!form.personalTrainerId) errors.personalTrainerId = 'Personal trainer is required.';
      if (!form.personalTrainingStartDate) errors.personalTrainingStartDate = 'Personal Training start date is required.';
      if (!selectedPersonalTrainingPlan.value || personalTrainingAmount.value <= 0) errors.personalTrainingAmount = 'Select a valid Personal Training plan.';
    }
  }

  return Object.keys(errors).length === 0;
}

function submitForm() {
  if (!validate()) {
    const messages = Object.values(errors);
    toast.add({
      severity: 'error',
      summary: 'Please fix the following',
      detail: messages.join(' \u2022 '),
      life: 5000
    });
    formRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  emit('submit', {
    ...form,
    discount: Number(form.discount || 0),
    amountPaid: Number(form.amountPaid || 0)
  });
}
</script>

<template>
  <form ref="formRef" class="stack-16" @submit.prevent="submitForm">
    <FormSection title="Personal Information" subtitle="Basic member profile and emergency contacts.">
      <div class="app-form-grid app-form-grid--three">
        <label class="app-field app-field--required">
          <span>Full Name</span>
          <InputText v-model="form.fullName" :invalid="!!errors.fullName" />
        </label>

        <label class="app-field app-field--required">
          <span>Mobile Number</span>
          <InputText v-model="form.mobile" :invalid="!!errors.mobile" maxlength="10" />
        </label>

        <label class="app-field app-field--required">
          <span>Email</span>
          <InputText v-model="form.email" :invalid="!!errors.email" />
        </label>

        <label class="app-field">
          <span>Gender</span>
          <Dropdown v-model="form.gender" :options="GENDER_OPTIONS" placeholder="Select" />
        </label>

        <label class="app-field">
          <span>Date of Birth</span>
          <Calendar v-model="form.dateOfBirth" date-format="yy-mm-dd" show-icon manual-input />
        </label>

        <label class="app-field app-field--full">
          <span>Address</span>
          <Textarea v-model="form.address" rows="2" auto-resize />
        </label>

        <label class="app-field">
          <span>Emergency Contact Name</span>
          <InputText v-model="form.emergencyContactName" />
        </label>

        <label class="app-field">
          <span>Emergency Contact Number</span>
          <InputText v-model="form.emergencyContactNumber" maxlength="10" />
        </label>
      </div>
    </FormSection>

    <FormSection title="Gym Information" subtitle="Membership assignment and device details.">
      <div class="app-form-grid app-form-grid--three">
        <label class="app-field">
          <span>Joining Date</span>
          <Calendar v-model="form.joiningDate" date-format="yy-mm-dd" show-icon manual-input :invalid="!!errors.joiningDate" />
        </label>

        <label v-if="!isEditMode" class="app-field app-field--required">
          <span>Membership Plan</span>
          <Dropdown
            v-model="form.planId"
            option-label="name"
            option-value="id"
            :options="plans"
            :invalid="!!errors.planId"
            placeholder="Select plan"
          />
        </label>

        <label class="app-field app-field--full">
          <span>Fingerprint / Device User ID</span>
          <InputText v-model="form.deviceUserId" />
          <small class="app-help">User ID assigned to this member on the biometric attendance device.</small>
        </label>
      </div>
    </FormSection>

    <FormSection
      v-if="!isEditMode"
      title="Personal Training"
      subtitle="Optional add-on with its own trainer, pricing, and dates."
    >
      <label class="settings-checkbox-row pt-toggle-row">
        <Checkbox v-model="form.addPersonalTraining" input-id="add-personal-training" binary />
        <span><strong>Add Personal Training</strong><small>Optional</small></span>
      </label>

      <div v-if="form.addPersonalTraining" class="app-form-grid app-form-grid--three pt-fields">
        <label class="app-field app-field--required">
          <span>Personal Training Plan</span>
          <Dropdown v-model="form.personalTrainingPlanId" :options="personalTrainingPlans" option-label="name" option-value="id" placeholder="Select PT plan" :invalid="!!errors.personalTrainingPlanId" />
        </label>
        <label class="app-field app-field--required">
          <span>Personal Trainer</span>
          <Dropdown v-model="form.personalTrainerId" :options="trainers" option-label="fullName" option-value="id" placeholder="Select active trainer" :invalid="!!errors.personalTrainerId" />
        </label>
        <label class="app-field app-field--required">
          <span>Start Date</span>
          <Calendar v-model="form.personalTrainingStartDate" date-format="yy-mm-dd" show-icon manual-input :invalid="!!errors.personalTrainingStartDate" />
        </label>
        <div class="app-field"><span>Duration</span><strong>{{ selectedPersonalTrainingPlan ? `${selectedPersonalTrainingPlan.duration} ${selectedPersonalTrainingPlan.durationUnit}` : '--' }}</strong></div>
        <div class="app-field"><span>PT Price</span><strong>{{ formatCurrency(personalTrainingAmount) }}</strong></div>
        <div class="app-field"><span>PT End Date</span><strong>{{ personalTrainingEndDate || '--' }}</strong></div>
      </div>
    </FormSection>

    <FormSection
      v-if="!isEditMode"
      title="Payment Summary"
      subtitle="Membership and Personal Training charges remain itemized."
    >
      <div class="app-form-grid app-form-grid--three">
        <div class="app-field app-field--full">
          <span>Selected Plan Summary</span>
          <div class="summary-bar" v-if="selectedPlan">
            <p>
              <strong>{{ selectedPlan.name }}</strong>
              <span>{{ selectedPlan.duration }} {{ selectedPlan.durationUnit }}</span>
              <span>{{ formatCurrency(selectedPlan.price) }}</span>
            </p>
          </div>
          <div v-else class="summary-bar summary-bar--empty">Select a membership plan to view pricing details.</div>
        </div>

        <div v-if="personalTrainingAmount > 0" class="app-field app-field--full">
          <span>Personal Training Summary</span>
          <div class="summary-bar">
            <p>
              <strong>{{ selectedPersonalTrainingPlan?.name || 'Personal Training' }}</strong>
              <span>{{ selectedPersonalTrainingPlan?.duration }} {{ selectedPersonalTrainingPlan?.durationUnit }}</span>
              <span>{{ formatCurrency(personalTrainingAmount) }}</span>
            </p>
          </div>
        </div>

        <label class="app-field">
          <span>Discount</span>
          <InputNumber
            v-model="form.discount"
            :min="0"
            :invalid="!!errors.discount"
            mode="decimal"
            prefix="₹"
            :min-fraction-digits="0"
            :max-fraction-digits="0"
          />
        </label>

        <label class="app-field">
          <span>Amount Paid</span>
          <InputNumber
            v-model="form.amountPaid"
            :min="0"
            :invalid="!!errors.amountPaid"
            mode="decimal"
            prefix="₹"
            :min-fraction-digits="0"
            :max-fraction-digits="0"
          />
        </label>

        <label class="app-field">
          <span>Payment Mode</span>
          <Dropdown
            v-model="form.paymentMode"
            :options="paymentModes"
            option-label="label"
            option-value="value"
            placeholder="Select mode"
            :invalid="!!errors.paymentMode"
          />
        </label>

        <div class="app-field">
          <span>Balance</span>
          <InputText :model-value="formatCurrency(purchaseTotals.pendingAmount)" readonly />
        </div>

        <div class="app-field app-field--full payment-breakdown">
          <p><span>Membership Charges <small>{{ selectedPlan?.name || '' }}</small></span><strong>{{ formatCurrency(purchaseTotals.membershipAmount) }}</strong></p>
          <p class="payment-breakdown__pt"><span>Personal Training Charges <small>{{ selectedPersonalTrainingPlan?.name || 'Not selected' }}</small></span><strong>{{ formatCurrency(purchaseTotals.personalTrainingAmount) }}</strong></p>
          <p><span>Subtotal</span><strong>{{ formatCurrency(purchaseTotals.subtotal) }}</strong></p>
          <p><span>Discount</span><strong>- {{ formatCurrency(purchaseTotals.discount) }}</strong></p>
          <p class="payment-breakdown__total"><span>Payable Amount</span><strong>{{ formatCurrency(purchaseTotals.totalAmount) }}</strong></p>
          <p><span>Paid Amount</span><strong>{{ formatCurrency(purchaseTotals.amountPaid) }}</strong></p>
          <p><span>Balance</span><strong>{{ formatCurrency(purchaseTotals.pendingAmount) }}</strong></p>
        </div>
      </div>
    </FormSection>

    <div class="form-actions">
      <Button type="button" label="Cancel" severity="secondary" outlined @click="emit('cancel')" />
      <Button
        type="submit"
        :label="isEditMode ? 'Save Changes' : 'Save Member'"
        :loading="saving"
        :disabled="saving"
      />
    </div>
  </form>
</template>
