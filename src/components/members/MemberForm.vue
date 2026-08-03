<script setup>
import { computed, reactive, ref, watch } from 'vue';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';

import { GENDER_OPTIONS, PAYMENT_METHOD } from '../../constants/domain';
import FormSection from '../common/FormSection.vue';
import { formatCurrency, toInputDate } from '../../utils/formatters';

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
const finalAmount = computed(() => Math.max(planAmount.value - Number(form.discount || 0), 0));
const pendingAmount = computed(() => Math.max(finalAmount.value - Number(form.amountPaid || 0), 0));
const isEditMode = computed(() => props.mode === 'edit');

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

    if (Number(form.discount) > planAmount.value) {
      errors.discount = 'Discount cannot exceed plan amount.';
    }

    if (Number(form.amountPaid) > finalAmount.value) {
      errors.amountPaid = 'Amount paid cannot exceed final amount.';
    }

    if (Number(form.amountPaid) > 0 && !form.paymentMode) {
      errors.paymentMode = 'Select payment mode for paid amount.';
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

    <FormSection title="Gym Information" subtitle="Membership assignment and trainer mapping.">
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

        <label class="app-field">
          <span>Trainer</span>
          <Dropdown
            v-model="form.trainerId"
            option-label="fullName"
            option-value="id"
            :options="trainers"
            placeholder="Select trainer"
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
      title="Membership and Payment"
      subtitle="Initial membership allocation and upfront payment collection."
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

        <label class="app-field">
          <span>Discount</span>
          <InputNumber v-model="form.discount" :min="0" :invalid="!!errors.discount" mode="currency" currency="INR" locale="en-IN" />
        </label>

        <label class="app-field">
          <span>Final Amount</span>
          <InputText :model-value="formatCurrency(finalAmount)" readonly />
        </label>

        <label class="app-field">
          <span>Amount Paid</span>
          <InputNumber v-model="form.amountPaid" :min="0" :invalid="!!errors.amountPaid" mode="currency" currency="INR" locale="en-IN" />
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
          <span>Pending Amount</span>
          <InputText :model-value="formatCurrency(pendingAmount)" readonly />
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
