<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';

import ActionRequiredSection from '../components/dashboard/ActionRequiredSection.vue';
import GymPulseCard from '../components/dashboard/GymPulseCard.vue';
import RecentAttendanceSection from '../components/dashboard/RecentAttendanceSection.vue';
import StatCard from '../components/common/StatCard.vue';
import { dashboardActions } from '../services/mockData/dashboardData';
import { useGymStore } from '../stores/gymStore';
import { toInputDate } from '../utils/formatters';

const gymStore = useGymStore();
const router = useRouter();

const greeting = computed(() => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning, Sneha';
  }

  if (hour < 17) {
    return 'Good afternoon, Sneha';
  }

  return 'Good evening, Sneha';
});

const dashboardDate = computed(() => {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: 'Asia/Kolkata'
  }).format(new Date());
});

const dashboardKpis = computed(() => [
  {
    id: 'check-ins',
    label: "Today's Check-ins",
    value: gymStore.dashboardStats.todayCheckIns,
    helper: 'Live check-ins today',
    context: 'Floor activity',
    trendText: '+12% from yesterday',
    progress: 62,
    icon: 'pi pi-calendar-plus',
    tone: 'violet',
    visualType: 'spark'
  },
  {
    id: 'active-members',
    label: 'Active Members',
    value: gymStore.dashboardStats.activeMembers,
    helper: `${gymStore.membersDetailed.length} total members`,
    context: 'Current active memberships',
    progress: (gymStore.dashboardStats.activeMembers / Math.max(gymStore.membersDetailed.length, 1)) * 100,
    icon: 'pi pi-users',
    tone: 'teal',
    visualType: 'ring'
  },
  {
    id: 'expiring-soon',
    label: 'Expiring Soon',
    value: gymStore.dashboardStats.expiringSoon,
    helper: 'Next 7 days',
    context: 'Renewal focus',
    progress: 28,
    icon: 'pi pi-exclamation-circle',
    tone: 'amber',
    visualType: 'urgency'
  },
  {
    id: 'monthly-collection',
    label: 'Monthly Collection',
    value: gymStore.dashboardStats.monthlyCollection,
    helper: '72% of monthly target',
    context: 'Collection momentum',
    trendText: 'Target: Rs 15,000',
    progress: 72,
    icon: 'pi pi-wallet',
    tone: 'cyan',
    visualType: 'progress',
    format: 'currency'
  }
]);

const gymPulse = computed(() => {
  const today = toInputDate();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = toInputDate(yesterdayDate);

  const todayEntries = gymStore.attendanceDetailed.filter(
    (entry) => new Date(entry.checkInTime).toISOString().slice(0, 10) === today
  );
  const yesterdayEntries = gymStore.attendanceDetailed.filter(
    (entry) => new Date(entry.checkInTime).toISOString().slice(0, 10) === yesterday
  );

  const slots = [
    { label: '6 AM', start: 6, end: 7 },
    { label: '7 AM', start: 7, end: 8 },
    { label: '8 AM', start: 8, end: 9 },
    { label: '9 AM', start: 9, end: 10 },
    { label: '6 PM', start: 18, end: 19 },
    { label: '7 PM', start: 19, end: 20 }
  ];

  const withCount = slots.map((slot) => {
    const count = todayEntries.filter((entry) => {
      const hour = new Date(entry.checkInTime).getHours();
      return hour >= slot.start && hour < slot.end;
    }).length;

    return {
      ...slot,
      count
    };
  });

  const highest = Math.max(...withCount.map((item) => item.count), 1);
  const peakSlot = withCount.find((item) => item.count === highest) || withCount[0];
  const compared = yesterdayEntries.length
    ? Math.round(((todayEntries.length - yesterdayEntries.length) / yesterdayEntries.length) * 100)
    : 12;

  return {
    todayCheckIns: todayEntries.length,
    peakTime: `${peakSlot.label} - ${peakSlot.end > 12 ? peakSlot.end - 12 : peakSlot.end} ${peakSlot.end >= 12 ? 'PM' : 'AM'}`,
    mostActivePeriod: peakSlot.start < 12 ? 'Morning' : 'Evening',
    comparedToYesterday: compared,
    hourly: withCount.map((item) => ({
      label: item.label,
      intensity: Math.max(Math.round((item.count / highest) * 100), item.count ? 18 : 6)
    }))
  };
});

const recentAttendance = computed(() => {
  return gymStore.attendanceDetailed.slice(0, 6).map((item) => ({
    id: item.id,
    name: item.memberName,
    avatar: item.memberName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    checkInAt: item.checkInTime,
    membershipPlan: item.memberStatus === 'INACTIVE' ? 'Inactive Member' : gymStore.getMemberById(item.memberId)?.membershipPlanName || 'Plan',
    expiryDate: gymStore.getMemberById(item.memberId)?.membershipExpiryDate,
    status: item.memberStatus
  }));
});

function goTo(path) {
  router.push(path);
}
</script>

<template>
  <section class="dashboard-view module-dashboard">
    <div class="dashboard-hero">
      <div>
        <p class="dashboard-hero__kicker">Dashboard</p>
        <h1 class="dashboard-hero__title">{{ greeting }} <span aria-hidden="true">👋</span></h1>
        <p class="dashboard-hero__subtitle">Here's what's happening at Downtown Fitness today.</p>
        <p class="dashboard-hero__motivation">Your gym is off to a strong start today.</p>
      </div>

      <div class="dashboard-hero__meta">
        <p class="dashboard-hero__date">{{ dashboardDate }}</p>
        <div class="dashboard-quick-actions">
          <Button label="Add Member" icon="pi pi-user-plus" text @click="goTo('/members/new')" />
          <Button label="Mark Attendance" icon="pi pi-check-square" text @click="goTo('/attendance')" />
          <Button label="Record Payment" icon="pi pi-wallet" text @click="goTo('/payments')" />
        </div>
      </div>
    </div>

    <div class="dashboard-grid-kpis">
      <StatCard
        v-for="kpi in dashboardKpis"
        :key="kpi.id"
        :title="kpi.label"
        :value="kpi.value"
        :helper="kpi.helper"
        :icon="kpi.icon"
        :tone="kpi.tone"
        :format="kpi.format"
        :context="kpi.context"
        :trend-text="kpi.trendText"
        :progress="kpi.progress"
        :visual-type="kpi.visualType"
        variant="dashboard"
      />
    </div>

    <div class="dashboard-grid-insights">
      <ActionRequiredSection :items="dashboardActions" />
      <GymPulseCard :stats="gymPulse" />
    </div>

    <RecentAttendanceSection :items="recentAttendance" />
  </section>
</template>