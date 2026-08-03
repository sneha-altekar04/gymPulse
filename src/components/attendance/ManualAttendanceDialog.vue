<script setup>
import { computed, reactive, watch } from 'vue';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

import StatusBadge from '../common/StatusBadge.vue';
import { formatDate, toInputDate } from '../../utils/formatters';

function currentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function combineDateTime(date, time) {
  if (!date || !time) return '';
  return `${date}T${time}`;
}

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  members: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:visible', 'submit']);

const form = reactive({
  memberId: '',
  checkInDate: toInputDate(),
  checkInTime: currentTime(),
  checkOutDate: '',
  checkOutTime: '',
  note: '',
  confirmExpired: false
});

watch(
  () => props.visible,
  (value) => {
    if (value) {
      form.memberId = '';
      form.checkInDate = toInputDate();
      form.checkInTime = currentTime();
      form.checkOutDate = '';
      form.checkOutTime = '';
      form.note = '';
      form.confirmExpired = false;
    }
  }
);

const memberOptions = computed(() =>
  props.members.map((member) => ({
    label: `${member.fullName} (${member.memberCode})`,
    value: member.id
  }))
);

const selectedMember = computed(() => props.members.find((item) => item.id === form.memberId) || null);
const isExpired = computed(() => selectedMember.value?.membershipStatus === 'EXPIRED');
const canSubmit = computed(() => {
  if (!selectedMember.value || !form.checkInDate || !form.checkInTime) {
    return false;
  }

  if (isExpired.value && !form.confirmExpired) {
    return false;
  }

  return true;
});

function close() {
  emit('update:visible', false);
}

function submit() {
  if (!canSubmit.value) {
    return;
  }

  const checkOut = form.checkOutDate && form.checkOutTime
    ? combineDateTime(form.checkOutDate, form.checkOutTime)
    : null;

  emit('submit', {
    memberId: form.memberId,
    checkInTime: combineDateTime(form.checkInDate, form.checkInTime),
    checkOutTime: checkOut,
    note: form.note,
    membershipStatus: selectedMember.value.membershipStatus
  });

  close();
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Manual Attendance"
    :style="{ width: 'min(680px, 95vw)' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="stack-16">
      <label class="app-field">
        <span>Select Member</span>
        <Dropdown v-model="form.memberId" :options="memberOptions" optionLabel="label" optionValue="value" filter placeholder="Search member" />
      </label>

      <div v-if="selectedMember" class="summary-bar">
        <p>
          <strong>{{ selectedMember.fullName }}</strong>
          <span>Membership: {{ selectedMember.membershipPlanName }}</span>
          <span>
            Expires:
            {{ selectedMember.membershipExpiryDate ? formatDate(selectedMember.membershipExpiryDate) : '--' }}
          </span>
          <StatusBadge :status="selectedMember.membershipStatus" />
        </p>
      </div>

      <div class="app-form-grid app-form-grid--two">
        <label class="app-field">
          <span>Check-in Date</span>
          <InputText v-model="form.checkInDate" type="date" />
        </label>

        <label class="app-field">
          <span>Check-in Time</span>
          <InputText v-model="form.checkInTime" type="time" />
        </label>

        <label class="app-field">
          <span>Check-out Date (optional)</span>
          <InputText v-model="form.checkOutDate" type="date" />
        </label>

        <label class="app-field">
          <span>Check-out Time (optional)</span>
          <InputText v-model="form.checkOutTime" type="time" />
        </label>

        <label class="app-field app-field--full">
          <span>Note (optional)</span>
          <Textarea v-model="form.note" rows="2" auto-resize />
        </label>
      </div>

      <div v-if="isExpired" class="app-warning-box">
        <p>This member has an expired membership. Confirm to continue with manual attendance entry.</p>
        <label class="checkbox-row">
          <Checkbox v-model="form.confirmExpired" binary />
          <span>I understand and want to continue.</span>
        </label>
      </div>

      <div class="form-actions">
        <Button type="button" label="Cancel" severity="secondary" outlined @click="close" />
        <Button type="button" label="Save Entry" :disabled="!canSubmit" @click="submit" />
      </div>
    </div>
  </Dialog>
</template>
