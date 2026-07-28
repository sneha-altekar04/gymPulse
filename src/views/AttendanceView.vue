<script setup>
import { computed, ref } from 'vue';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';

import ManualAttendanceDialog from '../components/attendance/ManualAttendanceDialog.vue';
import EmptyState from '../components/common/EmptyState.vue';
import PageHeader from '../components/common/PageHeader.vue';
import StatCard from '../components/common/StatCard.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import { useGymStore } from '../stores/gymStore';
import { formatDate, formatDurationFromTimes, formatTime, toInputDate } from '../utils/formatters';

const gymStore = useGymStore();
const toast = useToast();

const dateFilter = ref(toInputDate());
const memberSearch = ref('');
const membershipStatus = ref('ALL');
const sourceFilter = ref('ALL');

const manualDialogVisible = ref(false);

const sourceOptions = ['ALL', 'FINGERPRINT', 'MANUAL'];
const statusOptions = ['ALL', 'ACTIVE', 'EXPIRING SOON', 'EXPIRED', 'INACTIVE'];

const filteredAttendance = computed(() => {
  const search = memberSearch.value.trim().toLowerCase();

  return gymStore.attendanceDetailed.filter((entry) => {
    const entryDate = new Date(entry.checkInTime).toISOString().slice(0, 10);
    const dateMatch = !dateFilter.value || entryDate === dateFilter.value;
    const memberMatch =
      !search ||
      entry.memberName.toLowerCase().includes(search) ||
      entry.memberCode.toLowerCase().includes(search);
    const statusMatch = membershipStatus.value === 'ALL' || entry.memberStatus === membershipStatus.value;
    const sourceMatch = sourceFilter.value === 'ALL' || entry.source === sourceFilter.value;

    return dateMatch && memberMatch && statusMatch && sourceMatch;
  });
});

const attendanceKpis = computed(() => {
  const today = toInputDate();
  const todayRecords = gymStore.attendanceDetailed.filter(
    (entry) => new Date(entry.checkInTime).toISOString().slice(0, 10) === today
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
  const today = toInputDate();
  const todayRecords = gymStore.attendanceDetailed.filter(
    (entry) => new Date(entry.checkInTime).toISOString().slice(0, 10) === today
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

function clearFilters() {
  dateFilter.value = toInputDate();
  memberSearch.value = '';
  membershipStatus.value = 'ALL';
  sourceFilter.value = 'ALL';
}

function addManualEntry(payload) {
  gymStore.addManualAttendance(payload);
  toast.add({
    severity: 'success',
    summary: 'Attendance saved',
    detail: 'Manual attendance entry recorded successfully.',
    life: 2600
  });
}
</script>

<template>
  <section class="stack-16 module-attendance">
    <PageHeader title="Attendance" subtitle="Track check-ins and monitor live floor activity">
      <template #actions>
        <Button label="Manual Attendance" icon="pi pi-plus" @click="manualDialogVisible = true" />
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
      <Calendar v-model="dateFilter" date-format="yy-mm-dd" show-icon manual-input />
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
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in filteredAttendance" :key="entry.id" :class="{ 'table-row-alert': entry.memberStatus === 'EXPIRED' }">
            <td>{{ entry.memberName }}</td>
            <td>{{ entry.memberCode }}</td>
            <td>{{ formatTime(entry.checkInTime) }} | {{ formatDate(entry.checkInTime) }}</td>
            <td>{{ entry.checkOutTime ? formatTime(entry.checkOutTime) : '--' }}</td>
            <td>{{ formatDurationFromTimes(entry.checkInTime, entry.checkOutTime) }}</td>
            <td><StatusBadge :status="entry.memberStatus" /></td>
            <td>
              <StatusBadge :status="entry.source" :tone="entry.source === 'MANUAL' ? 'accent' : 'neutral'" />
            </td>
          </tr>
        </tbody>
      </table>
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
      @submit="addManualEntry"
    />
  </section>
</template>