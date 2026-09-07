<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';

import { buildDashboardInsights } from '../services/dashboardInsights';
import { useAuthStore } from '../stores/authStore';
import { useGymStore } from '../stores/gymStore';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';

const authStore = useAuthStore();
const gymStore = useGymStore();
const router = useRouter();

const role = computed(() => authStore.userProfile?.role || 'OWNER');
const firstName = computed(() => authStore.userProfile?.name?.split(' ')[0] || 'Sneha');
const gymName = computed(() => authStore.userProfile?.gymName || 'Downtown Fitness');
const isLoading = computed(() => gymStore.loading && !gymStore.dataLoaded);
const insights = computed(() => buildDashboardInsights({
  members: gymStore.membersDetailed,
  memberships: gymStore.membershipsDetailed,
  attendance: gymStore.attendanceDetailed,
  payments: gymStore.paymentsDetailed,
  personalTraining: gymStore.personalTrainingSubscriptionsDetailed
}));

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${firstName.value}`;
  if (hour < 17) return `Good afternoon, ${firstName.value}`;
  return `Good evening, ${firstName.value}`;
});

const dashboardDate = computed(() => new Intl.DateTimeFormat('en-IN', {
  weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata'
}).format(new Date()));

const contextMessage = computed(() => {
  if (gymStore.dashboardStats.expiringSoon > 0) return `${gymStore.dashboardStats.expiringSoon} memberships need attention this week.`;
  if (insights.value.visitsTrend.change > 0) return `Attendance is ${insights.value.visitsTrend.change}% higher than yesterday.`;
  if (!insights.value.todayVisits) return 'Today’s activity will appear after the first check-in.';
  return 'Your gym is off to a strong start today.';
});

const healthMetrics = computed(() => {
  if (role.value === 'TRAINER') {
    const trainerId = authStore.userProfile?.trainerId;
    const myMembers = gymStore.membersDetailed.filter((member) => member.trainerId === trainerId);
    return [
      { id: 'members', label: 'My Members', value: myMembers.length, detail: 'Currently assigned', tone: 'violet', icon: 'pi pi-users', route: { path: '/reports', query: { report: 'TRAINER_MEMBER_ACTIVITY', trainerId } } },
      { id: 'visits', label: "Today's Visits", value: insights.value.todayVisits, detail: insights.value.visitsTrend.label, tone: 'teal', icon: 'pi pi-bolt', route: { path: '/attendance', query: { period: 'TODAY' } } },
      { id: 'pt', label: 'Active PT', value: insights.value.activePtCount, detail: `${insights.value.ptExpiringCount} expiring soon`, tone: 'coral', icon: 'pi pi-star', route: { path: '/reports', query: { report: 'PT_EXPIRY', trainerId } } },
      { id: 'inactive', label: 'Needs Attention', value: gymStore.dashboardStats.inactiveMembers, detail: 'Inactive members', tone: 'orange', icon: 'pi pi-exclamation-circle', route: { path: '/reports', query: { report: 'MEMBER_ACTIVITY', activityLevel: 'INACTIVE' } } }
    ];
  }
  const isReceptionist = role.value === 'RECEPTIONIST';
  const todayCollection = gymStore.paymentsDetailed
    .filter((item) => new Date(item.paymentDate).toDateString() === new Date().toDateString())
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return [
    { id: 'members', label: 'Active Members', value: insights.value.activeMembers, detail: insights.value.activeMembersTrend.label, tone: 'violet', icon: 'pi pi-users', route: { path: '/members', query: { status: 'ACTIVE' } } },
    { id: 'visits', label: "Today's Visits", value: insights.value.todayVisits, detail: insights.value.visitsTrend.label, tone: 'teal', icon: 'pi pi-bolt', route: { path: '/attendance', query: { period: 'TODAY' } } },
    { id: 'revenue', label: isReceptionist ? 'Collection Today' : 'Collection', value: isReceptionist ? todayCollection : insights.value.monthlyRevenue, detail: isReceptionist ? 'Received today' : insights.value.revenueTrend.label, tone: 'emerald', icon: 'pi pi-indian-rupee', currency: true, route: { path: '/reports', query: { report: 'REVENUE_COLLECTIONS', period: isReceptionist ? 'TODAY' : 'THIS_MONTH' } } },
    { id: 'expiring', label: 'Expiring Soon', value: gymStore.dashboardStats.expiringSoon, detail: 'In the next 7 days', tone: 'orange', icon: 'pi pi-clock', route: { path: '/reports', query: { report: 'MEMBERSHIP_EXPIRY', status: 'EXPIRING SOON' } } }
  ];
});

const watchItems = computed(() => [
  { label: 'Expired memberships', count: gymStore.dashboardStats.expiredMemberships, tone: 'danger', route: { path: '/reports', query: { report: 'MEMBERSHIP_EXPIRY', status: 'EXPIRED' } } },
  { label: 'Expiring this week', count: gymStore.dashboardStats.expiringSoon, tone: 'warning', route: { path: '/reports', query: { report: 'MEMBERSHIP_EXPIRY', status: 'EXPIRING SOON' } } },
  { label: 'Inactive 10+ days', count: gymStore.dashboardStats.inactiveMembers, tone: 'violet', route: { path: '/reports', query: { report: 'MEMBER_ACTIVITY', activityLevel: 'INACTIVE' } } },
  { label: 'Outstanding payments', count: gymStore.dashboardStats.pendingPayments, tone: 'neutral', route: { path: '/reports', query: { report: 'OUTSTANDING_PAYMENTS' } } }
]);

const momentum = computed(() => [
  { label: 'Members', value: insights.value.activeMembers, trend: insights.value.activeMembersTrend, tone: 'violet', points: insights.value.momentumSeries.members },
  { label: 'Attendance', value: gymStore.attendanceDetailed.filter((item) => { const date = new Date(item.checkInTime); const now = new Date(); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); }).length, trend: insights.value.attendanceMonthTrend, tone: 'teal', points: insights.value.momentumSeries.attendance },
  { label: 'Revenue', value: formatCurrency(insights.value.monthlyRevenue), trend: insights.value.revenueTrend, tone: 'emerald', points: insights.value.momentumSeries.revenue }
]);

const quickActions = computed(() => role.value === 'TRAINER'
  ? [{ label: 'View My Members', icon: 'pi pi-users', route: '/members', primary: true }, { label: 'Mark Attendance', icon: 'pi pi-check-square', route: '/attendance' }]
  : [{ label: 'Add Member', icon: 'pi pi-user-plus', route: '/members/new', primary: true }, { label: 'Mark Attendance', icon: 'pi pi-check-square', route: '/attendance' }, { label: 'Record Payment', icon: 'pi pi-wallet', route: '/payments' }, { label: 'Renew Membership', icon: 'pi pi-refresh', route: '/memberships' }]);

function initials(name = '') {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function goTo(route) {
  router.push(route);
}
</script>

<template>
  <section class="command-center">
    <div v-if="isLoading" class="command-skeleton" aria-label="Loading dashboard">
      <div class="command-skeleton__hero"><Skeleton width="18rem" height="2.2rem" /><Skeleton width="25rem" height="1rem" /></div>
      <div class="command-skeleton__metrics"><Skeleton v-for="index in 4" :key="index" height="8rem" /></div>
      <div class="command-skeleton__body"><Skeleton height="23rem" /><Skeleton height="23rem" /></div>
    </div>

    <template v-else>
      <header class="command-hero">
        <div class="command-hero__copy">
          <p class="command-eyebrow">{{ dashboardDate }}</p>
          <h1>{{ greeting }} <span aria-hidden="true">👋</span></h1>
          <p>Here’s what’s happening at {{ gymName }} today.</p>
          <strong><i class="pi pi-sparkles" /> {{ contextMessage }}</strong>
        </div>
        <div class="command-actions" aria-label="Quick actions">
          <Button v-for="action in quickActions" :key="action.label" :label="action.label" :icon="action.icon" :outlined="!action.primary" :class="{ 'command-actions__primary': action.primary }" @click="goTo(action.route)" />
        </div>
      </header>

      <section aria-labelledby="business-health-title">
        <div class="section-heading section-heading--line"><div><p>Business health</p><h2 id="business-health-title">The numbers that shape today</h2></div><span>Live from your gym</span></div>
        <div class="health-grid">
          <button v-for="metric in healthMetrics" :key="metric.id" class="health-metric" :class="`health-metric--${metric.tone}`" @click="goTo(metric.route)">
            <span class="health-metric__icon"><i :class="metric.icon" /></span><span class="health-metric__label">{{ metric.label }}</span>
            <strong>{{ metric.currency ? formatCurrency(metric.value) : metric.value }}</strong><small>{{ metric.detail }}</small><i class="pi pi-arrow-up-right health-metric__arrow" />
          </button>
        </div>
      </section>

      <section aria-labelledby="today-title">
        <div class="section-heading"><div><p>Live operations</p><h2 id="today-title">Today at your gym</h2><span>Attendance movement across the day</span></div><button class="text-link" @click="goTo({ path: '/attendance', query: { period: 'TODAY' } })">View attendance <i class="pi pi-arrow-right" /></button></div>
        <div class="today-grid">
          <div class="attendance-visual">
            <div v-if="insights.todayVisits" class="attendance-chart" aria-label="Hourly attendance chart">
              <div v-for="slot in insights.hourly" :key="slot.hour" class="attendance-bar" :title="`${slot.label}: ${slot.count} visits`"><strong>{{ slot.count || '' }}</strong><span :style="{ height: `${slot.height}%` }" /><small>{{ slot.hour % 2 ? '' : slot.label }}</small></div>
            </div>
            <div v-else class="dashboard-empty"><i class="pi pi-chart-bar" /><h3>No attendance data yet</h3><p>The day’s rhythm will appear after the first check-in.</p></div>
            <div class="attendance-summary"><div><span>Peak hour</span><strong>{{ insights.peakLabel }}</strong></div><div><span>Total visits</span><strong>{{ insights.todayVisits }}</strong></div><div><span>Currently inside</span><strong>{{ insights.currentlyInside === null ? 'Not available' : `${insights.currentlyInside.length} members` }}</strong></div></div>
            <button v-if="insights.currentlyInside?.length" class="inside-stack" @click="goTo({ path: '/attendance', query: { period: 'TODAY', presence: 'INSIDE' } })"><span v-for="member in insights.currentlyInside.slice(0, 4)" :key="member.id">{{ initials(member.memberName) }}</span><strong v-if="insights.currentlyInside.length > 4">+{{ insights.currentlyInside.length - 4 }}</strong></button>
          </div>

          <aside class="members-watch">
            <div class="members-watch__head"><div><p>Priority queue</p><h3>Members to watch</h3></div><i class="pi pi-eye" /></div>
            <button v-for="item in watchItems" :key="item.label" :class="`watch-item watch-item--${item.tone}`" @click="goTo(item.route)"><span class="watch-item__dot" /><span>{{ item.label }}</span><strong>{{ item.count }}</strong><i class="pi pi-chevron-right" /></button>
            <div class="risk-insight"><span>Member retention</span><strong>{{ gymStore.dashboardStats.inactiveMembers }} members haven’t visited in 10+ days.</strong><div><button @click="goTo({ path: '/members', query: { status: 'INACTIVE' } })">View members</button><button v-if="role !== 'TRAINER'" @click="goTo('/messages')">Send reminder</button></div></div>
          </aside>
        </div>
      </section>

      <section v-if="role !== 'RECEPTIONIST'" aria-labelledby="momentum-title">
        <div class="section-heading section-heading--line"><div><p>Performance</p><h2 id="momentum-title">Gym Momentum</h2></div><span>This month</span></div>
        <div class="momentum-grid"><article v-for="item in momentum" :key="item.label" :class="`momentum-item momentum-item--${item.tone}`"><span>{{ item.label }}</span><strong>{{ item.value }}</strong><small :class="{ 'trend-down': item.trend.change < 0 }">{{ item.trend.label }}</small><div class="spark-bars" aria-hidden="true"><i v-for="(point, index) in item.points" :key="index" :style="{ height: `${point}%` }" /></div></article></div>
      </section>

      <section class="lower-grid">
        <div class="activity-feed">
          <div class="section-heading"><div><p>Latest movement</p><h2>Recent activity</h2></div><button class="text-link" @click="goTo('/attendance')">View all <i class="pi pi-arrow-right" /></button></div>
          <div v-if="insights.activity.length" class="activity-list"><button v-for="event in insights.activity" :key="event.id" :class="`activity-row activity-row--${event.type}`" @click="goTo(event.type === 'payment' ? '/payments' : event.type === 'member' ? '/members' : event.type === 'membership' ? '/memberships' : '/attendance')"><i :class="event.icon" /><span><strong>{{ event.person }}</strong><small>{{ event.description }}<template v-if="event.amount"> · {{ formatCurrency(event.amount) }}</template></small></span><time>{{ formatTime(event.date) }}<br/><small>{{ formatDate(event.date) }}</small></time></button></div>
          <div v-else class="dashboard-empty dashboard-empty--compact"><i class="pi pi-clock" /><h3>No recent activity</h3><p>Your first member event will appear here.</p></div>
        </div>

        <aside v-if="role !== 'TRAINER'" class="revenue-insight">
          <div class="revenue-insight__head"><span>Collection</span><i class="pi pi-wallet" /></div><strong>{{ formatCurrency(insights.monthlyRevenue) }}</strong><p>This month</p>
          <div class="revenue-track"><span :style="{ width: insights.monthlyRevenue ? `${(insights.membershipRevenue / insights.monthlyRevenue) * 100}%` : '0%' }" /></div>
          <dl><div><dt>Memberships</dt><dd>{{ formatCurrency(insights.membershipRevenue) }}</dd></div><div><dt>Personal Training</dt><dd>{{ formatCurrency(insights.ptRevenue) }}</dd></div></dl>
          <div v-if="insights.activePtCount" class="pt-insight"><span>Personal training</span><strong>{{ insights.activePtCount }} active PT members</strong><small>{{ insights.ptExpiringCount }} PT plans expiring soon</small><button @click="goTo({ path: '/reports', query: { report: role === 'RECEPTIONIST' ? 'PT_EXPIRY' : 'PT_REVENUE' } })">View report <i class="pi pi-arrow-right" /></button></div>
          <div v-else class="revenue-empty">PT revenue will appear after the first PT payment.</div>
        </aside>
      </section>
    </template>
  </section>
</template>

<style scoped>
.command-center{display:grid;gap:34px;max-width:1500px;margin:0 auto}.command-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding:8px 2px 2px}.command-eyebrow,.section-heading p,.members-watch__head p{margin:0;color:var(--text-muted);font-size:.73rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em}.command-hero h1{margin:8px 0 6px;color:var(--primary-strong);font:700 clamp(1.65rem,3vw,2.35rem)/1.12 'Sora',sans-serif;letter-spacing:0}.command-hero__copy>p:not(.command-eyebrow){margin:0;color:#556078}.command-hero__copy>strong{display:inline-flex;gap:7px;align-items:center;margin-top:14px;color:#3f5c1c;font-size:.85rem}.command-hero__copy>strong i{color:#78a927}.command-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;max-width:610px}.command-actions :deep(.p-button){min-height:39px;padding:0 13px;border-radius:8px;border-color:#dfe2dc;color:var(--primary-strong);background:#fff;transition:transform 180ms ease,box-shadow 180ms ease}.command-actions :deep(.p-button:hover){transform:translateY(-1px);box-shadow:var(--shadow-soft)}.command-actions :deep(.command-actions__primary){color:#fff;background:var(--primary-strong);border-color:var(--primary-strong)}
.section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px}.section-heading--line{padding-bottom:14px;border-bottom:1px solid var(--border-soft)}.section-heading h2{margin:4px 0 0;color:var(--primary-strong);font:700 1.25rem/1.25 'Sora',sans-serif;letter-spacing:0}.section-heading div>span,.section-heading>span{color:var(--text-muted);font-size:.8rem}.text-link{border:0;padding:5px 0;background:transparent;color:var(--primary-strong);font-weight:800;cursor:pointer}.text-link i{margin-left:5px;font-size:.75rem;transition:transform 180ms ease}.text-link:hover i{transform:translateX(3px)}
.health-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}.health-metric{position:relative;display:grid;grid-template-columns:auto 1fr;gap:6px 11px;min-width:0;padding:12px 24px 15px;border:0;border-right:1px solid var(--border-soft);background:transparent;text-align:left;cursor:pointer;transition:background 180ms ease}.health-metric:first-child{padding-left:2px}.health-metric:last-child{border-right:0}.health-metric:hover{background:rgba(255,255,255,.66)}.health-metric__icon{grid-row:1/3;width:36px;height:36px;display:grid;place-items:center;border-radius:9px}.health-metric__label{align-self:end;color:#59647b;font-size:.76rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.health-metric>strong{grid-column:2;color:var(--text-primary);font:700 1.75rem/1.1 'Sora',sans-serif}.health-metric small{grid-column:2;color:var(--text-muted);font-size:.74rem}.health-metric__arrow{position:absolute;top:12px;right:16px;color:#a4a9b3;font-size:.75rem}.health-metric--violet .health-metric__icon{color:var(--color-violet);background:var(--tint-violet)}.health-metric--teal .health-metric__icon{color:var(--color-teal);background:var(--tint-teal)}.health-metric--emerald .health-metric__icon{color:var(--color-emerald);background:var(--tint-emerald)}.health-metric--orange .health-metric__icon,.health-metric--coral .health-metric__icon{color:var(--color-orange);background:var(--tint-orange)}
.today-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(310px,.75fr);gap:22px}.attendance-visual{min-width:0;padding:22px 24px 18px;border:1px solid #ecece7;border-radius:12px;background:#fff}.attendance-chart{display:grid;grid-template-columns:repeat(17,minmax(14px,1fr));align-items:end;gap:7px;height:205px;padding:20px 4px 0;border-bottom:1px solid var(--border-soft);background-image:linear-gradient(to bottom,transparent 24%,#f1f1ed 25%,transparent 26%,transparent 49%,#f1f1ed 50%,transparent 51%,transparent 74%,#f1f1ed 75%,transparent 76%)}.attendance-bar{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px}.attendance-bar span{width:min(20px,100%);min-height:4px;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,var(--color-cyan),var(--color-teal));transition:opacity 180ms ease}.attendance-bar:hover span{opacity:.7}.attendance-bar strong{min-height:14px;font-size:.62rem;color:var(--color-teal)}.attendance-bar small{min-height:24px;color:var(--text-muted);font-size:.57rem;white-space:nowrap;transform:rotate(-40deg);transform-origin:top center}.attendance-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding-top:18px}.attendance-summary div{border-right:1px solid var(--border-soft)}.attendance-summary div:last-child{border:0}.attendance-summary span,.attendance-summary strong{display:block}.attendance-summary span{color:var(--text-muted);font-size:.72rem}.attendance-summary strong{margin-top:4px;font-size:.9rem}.inside-stack{display:flex;align-items:center;margin-top:15px;padding:0;border:0;background:transparent;cursor:pointer}.inside-stack span,.inside-stack strong{width:30px;height:30px;margin-left:-6px;display:grid;place-items:center;border:2px solid #fff;border-radius:50%;background:var(--tint-violet);color:var(--color-violet);font-size:.62rem}.inside-stack span:first-child{margin-left:0}.inside-stack strong{background:var(--primary-strong);color:#fff}
.members-watch{padding:21px;border-radius:12px;background:var(--primary-strong);color:#fff}.members-watch__head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.members-watch__head p{color:#9eb2d9}.members-watch__head h3{margin:5px 0 0;font:700 1.15rem 'Sora',sans-serif}.members-watch__head>i{color:var(--fitness-accent)}.watch-item{width:100%;display:grid;grid-template-columns:8px 1fr auto auto;gap:10px;align-items:center;padding:12px 2px;border:0;border-bottom:1px solid rgba(255,255,255,.12);background:transparent;color:#fff;text-align:left;cursor:pointer}.watch-item:hover{background:rgba(255,255,255,.05)}.watch-item__dot{width:7px;height:7px;border-radius:50%}.watch-item span:nth-child(2){color:#d7e0f3;font-size:.82rem}.watch-item strong{font:700 1.08rem 'Sora',sans-serif}.watch-item>i{color:#8095be;font-size:.7rem}.watch-item--danger .watch-item__dot{background:var(--color-coral)}.watch-item--warning .watch-item__dot{background:var(--color-orange)}.watch-item--violet .watch-item__dot{background:#b48cff}.watch-item--neutral .watch-item__dot{background:var(--color-cyan)}.risk-insight{margin-top:17px;padding:14px;border-left:3px solid var(--fitness-accent);background:rgba(255,255,255,.07)}.risk-insight>span{color:#aebedd;font-size:.66rem;text-transform:uppercase;font-weight:800}.risk-insight>strong{display:block;margin:5px 0 11px;font-size:.82rem;line-height:1.45}.risk-insight div{display:flex;gap:13px}.risk-insight button{padding:0;border:0;background:transparent;color:var(--fitness-accent);font-size:.72rem;font-weight:800;cursor:pointer}
.momentum-grid{display:grid;grid-template-columns:repeat(3,1fr)}.momentum-item{position:relative;min-height:132px;padding:4px 28px;border-right:1px solid var(--border-soft);overflow:hidden}.momentum-item:first-child{padding-left:2px}.momentum-item:last-child{border:0}.momentum-item>span,.momentum-item>strong,.momentum-item>small{display:block}.momentum-item>span{color:var(--text-muted);font-size:.77rem;font-weight:800;text-transform:uppercase}.momentum-item>strong{margin:8px 0 4px;font:700 1.65rem 'Sora',sans-serif}.momentum-item>small{color:var(--color-emerald);font-size:.72rem}.momentum-item>small.trend-down{color:var(--danger)}.spark-bars{position:absolute;inset:42px 12px 6px 47%;display:flex;gap:5px;align-items:end}.spark-bars i{flex:1;max-width:9px;border-radius:3px 3px 1px 1px;opacity:.65}.momentum-item--violet .spark-bars i{background:var(--color-violet)}.momentum-item--teal .spark-bars i{background:var(--color-teal)}.momentum-item--emerald .spark-bars i{background:var(--color-emerald)}
.lower-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.65fr);gap:32px;padding-top:6px;border-top:1px solid var(--border-soft)}.activity-list{display:grid}.activity-row{display:grid;grid-template-columns:35px 1fr auto;gap:12px;align-items:center;padding:12px 8px;border:0;border-bottom:1px solid var(--border-soft);background:transparent;text-align:left;cursor:pointer;transition:background 180ms ease,padding 180ms ease}.activity-row:hover{padding-left:13px;background:rgba(255,255,255,.7)}.activity-row>i{width:31px;height:31px;display:grid;place-items:center;border-radius:50%}.activity-row span strong,.activity-row span small{display:block}.activity-row span strong{color:var(--text-primary);font-size:.82rem}.activity-row span small{margin-top:2px;color:var(--text-muted);font-size:.74rem}.activity-row time{color:var(--text-muted);font-size:.7rem}.activity-row--attendance>i{color:var(--color-teal);background:var(--tint-teal)}.activity-row--payment>i{color:var(--color-emerald);background:var(--tint-emerald)}.activity-row--membership>i{color:var(--color-orange);background:var(--tint-orange)}.activity-row--member>i{color:var(--color-violet);background:var(--tint-violet)}
.revenue-insight{padding:20px;border:1px solid #e8e9e4;border-top:4px solid var(--color-emerald);border-radius:10px;background:#fff}.revenue-insight__head{display:flex;justify-content:space-between;color:var(--text-muted);font-size:.72rem;font-weight:800;text-transform:uppercase}.revenue-insight__head i{color:var(--color-emerald)}.revenue-insight>strong{display:block;margin-top:13px;font:700 1.75rem 'Sora',sans-serif}.revenue-insight>p{margin:2px 0 14px;color:var(--text-muted);font-size:.75rem}.revenue-track{height:7px;overflow:hidden;border-radius:5px;background:var(--tint-coral)}.revenue-track span{display:block;height:100%;background:var(--color-emerald)}.revenue-insight dl{margin:14px 0 18px}.revenue-insight dl div{display:flex;justify-content:space-between;gap:10px;padding:6px 0}.revenue-insight dt{color:var(--text-muted);font-size:.75rem}.revenue-insight dd{margin:0;font-size:.76rem;font-weight:800}.pt-insight{padding-top:16px;border-top:1px solid var(--border-soft)}.pt-insight>*{display:block}.pt-insight span{color:var(--color-coral);font-size:.67rem;font-weight:800;text-transform:uppercase}.pt-insight strong{margin-top:5px;font-size:.84rem}.pt-insight small{margin-top:3px;color:var(--text-muted);font-size:.72rem}.pt-insight button{margin-top:10px;padding:0;border:0;background:transparent;color:var(--color-violet);font-size:.72rem;font-weight:800;cursor:pointer}.revenue-empty{padding-top:15px;border-top:1px solid var(--border-soft);color:var(--text-muted);font-size:.75rem}
.dashboard-empty{min-height:205px;display:grid;place-items:center;align-content:center;text-align:center;color:var(--text-muted)}.dashboard-empty i{color:var(--color-teal);font-size:1.4rem}.dashboard-empty h3{margin:9px 0 3px;color:var(--text-primary);font-size:.9rem}.dashboard-empty p{margin:0;font-size:.76rem}.dashboard-empty--compact{min-height:170px}.command-skeleton{display:grid;gap:28px}.command-skeleton__hero{display:grid;gap:10px}.command-skeleton__metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.command-skeleton__body{display:grid;grid-template-columns:1.6fr .8fr;gap:22px}
@media(max-width:1180px){.command-hero{align-items:flex-start}.health-grid{grid-template-columns:repeat(2,1fr);row-gap:18px}.health-metric:nth-child(2){border-right:0}.health-metric:nth-child(3){padding-left:2px}.today-grid,.lower-grid{grid-template-columns:1fr}.revenue-insight{display:grid;grid-template-columns:1fr 1fr;column-gap:20px}.revenue-insight__head,.revenue-track,.revenue-insight dl,.pt-insight,.revenue-empty{grid-column:1/-1}}@media(max-width:800px){.command-center{gap:27px}.command-hero{display:grid}.command-actions{justify-content:flex-start}.momentum-grid{grid-template-columns:1fr}.momentum-item,.momentum-item:first-child{padding:16px 2px;border-right:0;border-bottom:1px solid var(--border-soft)}.momentum-item:last-child{border-bottom:0}.command-skeleton__metrics,.command-skeleton__body{grid-template-columns:1fr 1fr}}@media(max-width:600px){.health-grid{grid-template-columns:1fr}.health-metric,.health-metric:first-child,.health-metric:nth-child(3){padding:12px 2px;border-right:0;border-bottom:1px solid var(--border-soft)}.health-metric:last-child{border-bottom:0}.attendance-visual{padding:16px 12px}.attendance-chart{gap:3px}.attendance-summary{grid-template-columns:1fr}.attendance-summary div{padding-bottom:9px;border-right:0;border-bottom:1px solid var(--border-soft)}.section-heading{align-items:flex-start}.section-heading .text-link{font-size:.72rem}.revenue-insight{display:block}.command-skeleton__metrics,.command-skeleton__body{grid-template-columns:1fr}}
</style>