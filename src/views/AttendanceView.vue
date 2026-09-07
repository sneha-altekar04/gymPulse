<script setup>
import { computed, ref, watch } from 'vue';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Paginator from 'primevue/paginator';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

import ManualAttendanceDialog from '../components/attendance/ManualAttendanceDialog.vue';
import EmptyState from '../components/common/EmptyState.vue';
import PageHeader from '../components/common/PageHeader.vue';
import StatCard from '../components/common/StatCard.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import { useGymStore } from '../stores/gymStore';
import { formatDate, formatDurationFromTimes, formatTime, toInputDate } from '../utils/formatters';

function toBusinessDateKey(value) {
  if (!value) return '';

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Kolkata'
  }).format(date);
}

function tomorrowDateLimit() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(23, 59, 59, 999);
  return date;
}

const gymStore = useGymStore();
const confirm = useConfirm();
const toast = useToast();

const dateFilter = ref('');
const memberSearch = ref('');
const membershipStatus = ref('ALL');
const sourceFilter = ref('ALL');
const page = ref(0);
const rowsPerPage = 20;

const manualDialogVisible = ref(false);
const editingAttendance = ref(null);
const tomorrowLimit = tomorrowDateLimit();

const sourceOptions = ['ALL', 'FINGERPRINT', 'MANUAL'];
const statusOptions = ['ALL', 'ACTIVE', 'EXPIRING SOON', 'EXPIRED', 'INACTIVE'];

const filteredAttendance = computed(() => {
  const search = memberSearch.value.trim().toLowerCase();
  const selectedDate = toBusinessDateKey(dateFilter.value);

  return gymStore.attendanceDetailed.filter((entry) => {
    const entryDate = toBusinessDateKey(entry.checkInTime);
    const dateMatch = !selectedDate || entryDate === selectedDate;
    const memberMatch =
      !search ||
      entry.memberName.toLowerCase().includes(search) ||
      entry.memberCode.toLowerCase().includes(search);
    const statusMatch = membershipStatus.value === 'ALL' || entry.memberStatus === membershipStatus.value;
    const sourceMatch = sourceFilter.value === 'ALL' || entry.source === sourceFilter.value;

    return dateMatch && memberMatch && statusMatch && sourceMatch;
  });
});

const pagedAttendance = computed(() => {
  const start = page.value * rowsPerPage;
  return filteredAttendance.value.slice(start, start + rowsPerPage);
});

watch(
  () => filteredAttendance.value.length,
  (count) => {
    const maxPage = Math.max(Math.ceil(count / rowsPerPage) - 1, 0);
    if (page.value > maxPage) {
      page.value = maxPage;
    }
  }
);

const attendanceKpis = computed(() => {
  const today = toBusinessDateKey(toInputDate());
  const todayRecords = gymStore.attendanceDetailed.filter(
    (entry) => toBusinessDateKey(entry.checkInTime) === today
  );

  const currentlyInside = todayRecords.filter((entry) => !entry.checkOutTime).length;
  const manualToday = todayRecords.filter((entry) => entry.source === 'MANUAL').length;
  const expiredAttempts = todayRecords.filter((entry) => entry.memberStatus === 'EXPIRED').length;
  const slots = [6, 7, 8, 9, 18, 19];
  const slotCounts = slots.map((hour) => ({
    hour,
    count: todayRecords.filter((entry) => new Date(entry.checkInTime).getHours() === hour).length
  }));
  const peak = slotCounts.sort((a, b) => b.count - a.count)[0] || { hour: 6, count: 0 };
  const toHourLabel = (hour) => {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const normalized = hour > 12 ? hour - 12 : hour;
    return `${normalized} ${suffix}`;
  };

  return {
    todayCheckIns: todayRecords.length,
    currentlyInside,
    manualToday,
    expiredAttempts,
    peakCount: peak.count,
    peakHourLabel: toHourLabel(peak.hour)
  };
});

const attendanceTimeline = computed(() => {
  const today = toBusinessDateKey(toInputDate());
  const todayRecords = gymStore.attendanceDetailed.filter(
    (entry) => toBusinessDateKey(entry.checkInTime) === today
  );

  const slots = [
    { label: '6 AM', hour: 6 },
    { label: '7 AM', hour: 7 },
    { label: '8 AM', hour: 8 },
    { label: '9 AM', hour: 9 },
    { label: '6 PM', hour: 18 },
    { label: '7 PM', hour: 19 }
  ];

  const counts = slots.map((slot) => {
    const count = todayRecords.filter((entry) => new Date(entry.checkInTime).getHours() === slot.hour).length;
    return { ...slot, count };
  });
  const max = Math.max(...counts.map((item) => item.count), 1);

  return counts.map((item) => ({
    ...item,
    intensity: Math.max(8, Math.round((item.count / max) * 100))
  }));
});

watch([dateFilter, memberSearch, membershipStatus, sourceFilter], () => {
  page.value = 0;
});

watch(manualDialogVisible, (visible) => {
  if (!visible) {
    editingAttendance.value = null;
  }
});

function clearFilters() {
  dateFilter.value = '';
  memberSearch.value = '';
  membershipStatus.value = 'ALL';
  sourceFilter.value = 'ALL';
  page.value = 0;
}

function openAddAttendance() {
  editingAttendance.value = null;
  manualDialogVisible.value = true;
}

function openEditAttendance(entry) {
  editingAttendance.value = entry;
  manualDialogVisible.value = true;
}

async function submitAttendance(payload) {
  try {
    if (editingAttendance.value) {
      await gymStore.updateManualAttendance(editingAttendance.value.id, payload);
      toast.add({
        severity: 'success',
        summary: 'Attendance updated',
        detail: 'Manual attendance entry updated successfully.',
        life: 2600
      });
    } else {
      await gymStore.addManualAttendance(payload);
      toast.add({
        severity: 'success',
        summary: 'Attendance saved',
        detail: 'Manual attendance entry recorded successfully.',
        life: 2600
      });
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: editingAttendance.value ? 'Update failed' : 'Save failed',
      detail: error.message || 'Failed to save attendance.',
      life: 4000
    });
    return;
  } finally {
    editingAttendance.value = null;
  }
}

function deleteAttendance(entry) {
  confirm.require({
    message: `Delete the attendance entry for ${entry.memberName}?`,
    header: 'Delete Attendance',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await gymStore.deleteManualAttendance(entry.id);
        toast.add({
          severity: 'info',
          summary: 'Attendance deleted',
          detail: 'Manual attendance entry removed successfully.',
          life: 2600
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Delete failed',
          detail: error.message || 'Failed to delete attendance.',
          life: 4000
        });
      }
    }
  });
}
</script>

<template>
  <section class="stack-16 module-attendance">
    <PageHeader title="Attendance" subtitle="Track check-ins and monitor live floor activity">
      <template #actions>
        <Button label="Manual Attendance" icon="pi pi-plus" @click="openAddAttendance" />
      </template>
    </PageHeader>

    <div class="dashboard-grid-kpis">
      <StatCard title="Today's Check-ins" :value="attendanceKpis.todayCheckIns" helper="All attendance sources" icon="pi pi-calendar-plus" tone="teal" />
      <StatCard title="Currently Inside" :value="attendanceKpis.currentlyInside" helper="No check-out recorded" icon="pi pi-users" tone="cyan" />
      <StatCard :title="`Peak Hour (${attendanceKpis.peakHourLabel})`" :value="attendanceKpis.peakCount" helper="Highest check-in window" icon="pi pi-bolt" tone="lime" />
      <StatCard title="Manual Entries" :value="attendanceKpis.manualToday" helper="Reception-managed entries" icon="pi pi-pencil" tone="amber" />
    </div>

    <div class="attendance-activity-rail">
      <p class="attendance-activity-rail__title">Activity Timeline</p>
      <div class="attendance-activity-rail__bars" role="img" aria-label="Attendance activity by hour">
        <div v-for="slot in attendanceTimeline" :key="slot.label" class="attendance-activity-rail__row">
          <span>{{ slot.label }}</span>
          <div class="attendance-activity-rail__track">
            <div class="attendance-activity-rail__fill" :style="{ width: `${slot.intensity}%` }" />
          </div>
        </div>
      </div>
    </div>

    <div class="toolbar-grid toolbar-grid--open">
      <Calendar
        v-model="dateFilter"
        date-format="yy-mm-dd"
        show-icon
        manual-input
        show-other-months
        select-other-months
        :maxDate="tomorrowLimit"
      />
      <span class="p-input-icon-left">
        <i class="pi pi-search" />
        <InputText v-model="memberSearch" placeholder="Search member" />
      </span>
      <Dropdown v-model="membershipStatus" :options="statusOptions" />
      <Dropdown v-model="sourceFilter" :options="sourceOptions" />
      <Button label="Clear Filters" text @click="clearFilters" />
    </div>

    <div v-if="filteredAttendance.length" class="app-table-wrap app-table-wrap--open">
      <table class="app-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Member ID</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Duration</th>
            <th>Membership Status</th>
            <th>Source</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in pagedAttendance" :key="entry.id" :class="{ 'table-row-alert': entry.memberStatus === 'EXPIRED' }">
            <td>{{ entry.memberName }}</td>
            <td>{{ entry.memberCode }}</td>
            <td>{{ formatTime(entry.checkInTime) }} | {{ formatDate(entry.checkInTime) }}</td>
            <td>{{ entry.checkOutTime ? formatTime(entry.checkOutTime) : '--' }}</td>
            <td>{{ formatDurationFromTimes(entry.checkInTime, entry.checkOutTime) }}</td>
            <td><StatusBadge :status="entry.memberStatus" /></td>
            <td>
              <StatusBadge :status="entry.source" :tone="entry.source === 'MANUAL' ? 'accent' : 'neutral'" />
            </td>
            <td class="table-actions">
              <Button icon="pi pi-pencil" text rounded aria-label="Edit attendance" title="Edit attendance" @click.stop="openEditAttendance(entry)" />
              <Button icon="pi pi-trash" text rounded severity="danger" aria-label="Delete attendance" title="Delete attendance" @click.stop="deleteAttendance(entry)" />
            </td>
          </tr>
        </tbody>
      </table>

      <Paginator
        :rows="rowsPerPage"
        :total-records="filteredAttendance.length"
        :first="page * rowsPerPage"
        :rows-per-page-options="[20]"
        @page="page = $event.page"
      />
    </div>

    <EmptyState
      v-else
      title="No attendance records match your filters."
      description="Try a different date or broaden member/status filters."
      action-label="Clear Filters"
      @action="clearFilters"
    />

    <ManualAttendanceDialog
      v-model:visible="manualDialogVisible"
      :members="gymStore.membersDetailed"
      :entry="editingAttendance"
      @submit="submitAttendance"
    />
  </section>
</template>