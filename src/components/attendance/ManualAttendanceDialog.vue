<script setup>
import { computed, reactive, watch } from 'vue';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';

import StatusBadge from '../common/StatusBadge.vue';
import { formatDate, toInputDateTime } from '../../utils/formatters';

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
  checkInTime: toInputDateTime(),
  checkOutTime: '',
  note: '',
  confirmExpired: false
});

watch(
  () => props.visible,
  (value) => {
    if (value) {
      form.memberId = '';
      form.checkInTime = toInputDateTime();
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
  if (!selectedMember.value || !form.checkInTime) {
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

  emit('submit', {
    memberId: form.memberId,
    checkInTime: form.checkInTime,
    checkOutTime: form.checkOutTime || null,
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
        <Dropdown v-model="form.memberId" :options="memberOptions" filter placeholder="Search member" />
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
          <span>Check-in Date/Time</span>
          <Calendar v-model="form.checkInTime" show-time hour-format="12" date-format="yy-mm-dd" show-icon />
        </label>

        <label class="app-field">
          <span>Check-out Date/Time (optional)</span>
          <Calendar v-model="form.checkOutTime" show-time hour-format="12" date-format="yy-mm-dd" show-icon />
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
