<script setup>
import { computed, reactive, watch } from 'vue';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Calendar from 'primevue/calendar';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';

import StatusBadge from '../common/StatusBadge.vue';
import { formatDate, toInputDate } from '../../utils/formatters';

function currentTime() {
  const now = new Date();
  const roundedMinutes = Math.round((now.getHours() * 60 + now.getMinutes()) / 5) * 5;
  const hours = Math.floor(roundedMinutes / 60) % 24;
  const minutes = roundedMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function timeOneHourLater(timeValue) {
  const [hourPart, minutePart] = timeValue.split(':');
  const date = new Date();
  date.setHours(Number(hourPart), Number(minutePart), 0, 0);
  date.setHours(date.getHours() + 1);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function splitTime24(time24) {
  const [hourPart, minutePart] = String(time24 || '00:00').split(':');
  const hour = Number(hourPart);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return {
    time: `${String(displayHour).padStart(2, '0')}:${minutePart}`,
    period
  };
}

function composeTime24(time12, period) {
  if (!time12 || !period) return '';

  const [hourPart, minutePart] = time12.split(':');
  let hour = Number(hourPart);

  if (period === 'AM') {
    hour = hour === 12 ? 0 : hour;
  } else if (period === 'PM') {
    hour = hour === 12 ? 12 : hour + 12;
  }

  return `${String(hour).padStart(2, '0')}:${minutePart}`;
}

function buildTwelveHourOptions(intervalMinutes = 5) {
  const options = [];

  for (let minutesFromMidnight = 0; minutesFromMidnight < 12 * 60; minutesFromMidnight += intervalMinutes) {
    const hour = Math.floor(minutesFromMidnight / 60);
    const minute = minutesFromMidnight % 60;
    const displayHour = hour % 12 || 12;
    const value = `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    options.push({ label: value, value });
  }

  return options;
}

function toAttendanceDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Kolkata'
  }).format(new Date(value));
}

function toAttendanceTimeKey(value) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  }).format(new Date(value));
}

function formatTimeLabel(timeValue) {
  const [hourPart, minutePart] = timeValue.split(':');
  const hour = Number(hourPart);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, '0')}:${minutePart} ${suffix}`;
}

function buildTimeOptions(intervalMinutes = 5) {
  const options = [];

  for (let minutesFromMidnight = 0; minutesFromMidnight < 24 * 60; minutesFromMidnight += intervalMinutes) {
    const hour = Math.floor(minutesFromMidnight / 60);
    const minute = minutesFromMidnight % 60;
    const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    options.push({ label: formatTimeLabel(value), value });
  }

  return options;
}

function tomorrowDateLimit() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(23, 59, 59, 999);
  return date;
}

function combineDateTime(date, time) {
  if (!date || !time) return '';
  return `${date}T${time}`;
}

function toDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Kolkata'
  }).format(new Date(value));
}

function isCheckoutValid(checkInDate, checkInTime, checkOutDate, checkOutTime) {
  const checkInDateKey = toDateKey(checkInDate);
  const checkOutDateKey = toDateKey(checkOutDate);

  if (!checkOutDateKey && !checkOutTime) return true;
  if (!checkOutDateKey || !checkOutTime) return false;
  if (checkOutDateKey !== checkInDateKey) return false;
  return checkOutTime > checkInTime;
}

function createDefaultTimeParts() {
  const checkInTime24 = currentTime();
  const checkIn = splitTime24(checkInTime24);
  const checkOut = splitTime24(timeOneHourLater(checkInTime24));
  return { checkIn, checkOut };
}

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  members: {
    type: Array,
    default: () => []
  },
  entry: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:visible', 'submit']);

const defaultTimeParts = createDefaultTimeParts();

const form = reactive({
  memberId: '',
  checkInDate: toInputDate(),
  checkInTime: defaultTimeParts.checkIn.time,
  checkInPeriod: defaultTimeParts.checkIn.period,
  checkOutDate: toInputDate(),
  checkOutTime: defaultTimeParts.checkOut.time,
  checkOutPeriod: defaultTimeParts.checkOut.period,
  note: '',
  confirmExpired: false
});

function resetForm(entry = null) {
  if (!entry) {
    const nextDefaultTimeParts = createDefaultTimeParts();
    form.memberId = '';
    form.checkInDate = toInputDate();
    form.checkInTime = nextDefaultTimeParts.checkIn.time;
    form.checkInPeriod = nextDefaultTimeParts.checkIn.period;
    form.checkOutDate = form.checkInDate;
    form.checkOutTime = nextDefaultTimeParts.checkOut.time;
    form.checkOutPeriod = nextDefaultTimeParts.checkOut.period;
    form.note = '';
    form.confirmExpired = false;
    return;
  }

  form.memberId = entry.memberId || '';
  form.checkInDate = toAttendanceDateKey(entry.checkInTime);
  const checkInParts = splitTime24(toAttendanceTimeKey(entry.checkInTime));
  form.checkInTime = checkInParts.time;
  form.checkInPeriod = checkInParts.period;
  form.checkOutDate = entry.checkOutTime ? toAttendanceDateKey(entry.checkOutTime) : form.checkInDate;
  const checkOutParts = entry.checkOutTime ? splitTime24(toAttendanceTimeKey(entry.checkOutTime)) : splitTime24(timeOneHourLater(composeTime24(form.checkInTime, form.checkInPeriod)));
  form.checkOutTime = checkOutParts.time;
  form.checkOutPeriod = checkOutParts.period;
  form.note = entry.note || '';
  form.confirmExpired = false;
}

watch(
  () => [props.visible, props.entry],
  ([visible]) => {
    if (visible) {
      resetForm(props.entry);
    }
  },
  { immediate: true }
);

watch(
  () => form.checkInDate,
  (value) => {
    form.checkOutDate = value;
  }
);

const memberOptions = computed(() =>
  props.members.map((member) => ({
    label: `${member.fullName} (${member.memberCode})`,
    value: member.id
  }))
);

const timeOptions = computed(() => buildTwelveHourOptions(5));
const tomorrowLimit = tomorrowDateLimit();
const isEditing = computed(() => Boolean(props.entry?.id));
const dialogTitle = computed(() => (isEditing.value ? 'Edit Attendance' : 'Manual Attendance'));
const submitLabel = computed(() => (isEditing.value ? 'Update Entry' : 'Save Entry'));

const periodOptions = [
  { label: 'AM', value: 'AM' },
  { label: 'PM', value: 'PM' }
];

const selectedMember = computed(() => props.members.find((item) => item.id === form.memberId) || null);
const isExpired = computed(() => selectedMember.value?.membershipStatus === 'EXPIRED');
const checkoutError = computed(() => {
  const checkInDateKey = toDateKey(form.checkInDate);
  const checkOutDateKey = toDateKey(form.checkOutDate);
  const checkInTime24 = composeTime24(form.checkInTime, form.checkInPeriod);
  const checkOutTime24 = composeTime24(form.checkOutTime, form.checkOutPeriod);

  if (!checkOutDateKey && !checkOutTime24) return '';
  if (!checkOutDateKey || !checkOutTime24) return 'Select both checkout date and time.';
  if (checkOutDateKey !== checkInDateKey) return 'Checkout date must match the check-in date.';
  if (checkOutTime24 <= checkInTime24) return 'Checkout time must be later than check-in time.';
  return '';
});
const canSubmit = computed(() => {
  if (!selectedMember.value || !form.checkInDate || !form.checkInTime || !form.checkInPeriod) {
    return false;
  }

  if (isExpired.value && !form.confirmExpired) {
    return false;
  }

  const checkInTime24 = composeTime24(form.checkInTime, form.checkInPeriod);
  const checkOutTime24 = composeTime24(form.checkOutTime, form.checkOutPeriod);

  if (!isCheckoutValid(form.checkInDate, checkInTime24, form.checkOutDate, checkOutTime24)) {
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

  const checkInTime24 = composeTime24(form.checkInTime, form.checkInPeriod);
  const checkOutTime24 = composeTime24(form.checkOutTime, form.checkOutPeriod);
  const checkOut = form.checkOutDate && checkOutTime24
    ? combineDateTime(toDateKey(form.checkOutDate), checkOutTime24)
    : null;

  emit('submit', {
    memberId: form.memberId,
    checkInTime: combineDateTime(form.checkInDate, checkInTime24),
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
    :header="dialogTitle"
    :style="{ width: 'min(680px, 95vw)' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="stack-16">
      <label class="app-field">
        <span>Select Member</span>
        <Dropdown v-model="form.memberId" :options="memberOptions" optionLabel="label" optionValue="value" filter placeholder="Search member" :disabled="isEditing" />
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
          <Calendar v-model="form.checkInDate" date-format="yy-mm-dd" show-icon manual-input show-other-months select-other-months :maxDate="tomorrowLimit" />
        </label>

        <label class="app-field">
          <span>Check-in Time</span>
          <div class="time-picker">
            <Dropdown v-model="form.checkInTime" class="time-picker__clock" :options="timeOptions" optionLabel="label" optionValue="value" filter placeholder="Select time" />
            <div class="time-picker__period" role="group" aria-label="Check-in period">
              <button
                v-for="option in periodOptions"
                :key="option.value"
                type="button"
                class="time-picker__toggle"
                :class="{ 'time-picker__toggle--active': form.checkInPeriod === option.value }"
                @click="form.checkInPeriod = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </label>

        <label class="app-field">
          <span>Check-out Date (optional)</span>
          <Calendar v-model="form.checkOutDate" date-format="yy-mm-dd" show-icon manual-input show-other-months select-other-months :maxDate="tomorrowLimit" />
        </label>

        <label class="app-field">
          <span>Check-out Time (optional)</span>
          <div class="time-picker">
            <Dropdown v-model="form.checkOutTime" class="time-picker__clock" :options="timeOptions" optionLabel="label" optionValue="value" filter placeholder="Select time" />
            <div class="time-picker__period" role="group" aria-label="Check-out period">
              <button
                v-for="option in periodOptions"
                :key="option.value"
                type="button"
                class="time-picker__toggle"
                :class="{ 'time-picker__toggle--active': form.checkOutPeriod === option.value }"
                @click="form.checkOutPeriod = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </label>

        <p v-if="checkoutError" class="app-field app-field--full app-error">
          {{ checkoutError }}
        </p>

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
        <Button type="button" :label="submitLabel" :disabled="!canSubmit" @click="submit" />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.time-picker {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-picker__clock {
  flex: 1;
  min-width: 0;
}

.time-picker__period {
  width: 100px;
  display: flex;
  flex-direction: row;
  gap: 4px;
}

.time-picker__toggle {
  flex: 1;
  height: 100%;
  min-height: 40px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: #fff;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease;
}

.time-picker__toggle:hover {
  border-color: rgba(79, 110, 247, 0.35);
}

.time-picker__toggle--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

@media (max-width: 640px) {
  .time-picker {
    align-items: stretch;
  }

  .time-picker__period {
    width: 84px;
  }

  .time-picker__toggle {
    min-height: 36px;
  }
}
</style>
