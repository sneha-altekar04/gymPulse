function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth(value = new Date()) {
  const date = startOfDay(value);
  date.setDate(1);
  return date;
}

function validDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function inRange(value, start, end) {
  const date = validDate(value);
  return Boolean(date && date >= start && date < end);
}

function trend(current, previous, comparison) {
  if (!previous) return { change: null, label: 'Not enough historical data' };
  const change = Math.round(((current - previous) / previous) * 100);
  return { change, label: `${change >= 0 ? '+' : ''}${change}% ${comparison}` };
}

function eventDate(item, keys) {
  for (const key of keys) {
    const date = validDate(item[key]);
    if (date) return date;
  }
  return null;
}

function eventTimestamp(item, keys) {
  for (const key of keys) {
    const date = validDate(item[key]);
    if (date) return date.getTime();
  }
  return 0;
}

function normalizeSeries(values) {
  const highest = Math.max(...values, 1);
  return values.map((value) => Math.max(Math.round((value / highest) * 100), value ? 10 : 3));
}

export function buildDashboardInsights({ members, memberships, attendance, payments, personalTraining }) {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const currentMonth = startOfMonth(now);
  const previousMonth = new Date(currentMonth);
  previousMonth.setMonth(previousMonth.getMonth() - 1);

  const todayAttendance = attendance.filter((entry) => inRange(entry.checkInTime, today, tomorrow));
  const yesterdayAttendance = attendance.filter((entry) => inRange(entry.checkInTime, yesterday, today));
  const currentMonthAttendance = attendance.filter((entry) => inRange(entry.checkInTime, currentMonth, tomorrow));
  const previousMonthAttendance = attendance.filter((entry) => inRange(entry.checkInTime, previousMonth, currentMonth));
  const currentMonthPayments = payments.filter((entry) => inRange(entry.paymentDate, currentMonth, tomorrow));
  const previousMonthPayments = payments.filter((entry) => inRange(entry.paymentDate, previousMonth, currentMonth));
  const currentRevenue = currentMonthPayments.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const previousRevenue = previousMonthPayments.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  const hourly = Array.from({ length: 17 }, (_, index) => {
    const hour = index + 5;
    return {
      hour,
      label: `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`,
      count: todayAttendance.filter((entry) => new Date(entry.checkInTime).getHours() === hour).length
    };
  });
  const peak = hourly.reduce((highest, slot) => slot.count > highest.count ? slot : highest, hourly[0]);
  const maxHourly = Math.max(...hourly.map((slot) => slot.count), 1);
  const currentlyInsideRecords = todayAttendance.filter((entry) => !entry.checkOutTime);
  const canShowCurrentlyInside = todayAttendance.some((entry) => Object.hasOwn(entry, 'checkOutTime'));
  const activePt = personalTraining.filter((item) => item.status === 'ACTIVE');
  const ptExpiring = activePt.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 7);
  const ptRevenue = currentMonthPayments.reduce((sum, entry) => sum + Number(entry.personalTrainingAmount || 0), 0);
  const membershipRevenue = Math.max(currentRevenue - ptRevenue, 0);
  const previousActiveMembers = new Set(
    memberships
      .filter((item) => {
        const start = validDate(item.startDate);
        const end = validDate(item.endDate);
        return start && end && start < currentMonth && end >= currentMonth;
      })
      .map((item) => item.memberId)
  ).size;
  const activeMembers = members.filter((member) => member.membershipStatus === 'ACTIVE').length;
  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const start = new Date(today);
    start.setDate(start.getDate() - (6 - index));
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  });
  const memberSeries = recentDays.map(({ end }) => new Set(
    memberships
      .filter((item) => {
        const start = validDate(item.startDate);
        const membershipEnd = validDate(item.endDate);
        return start && membershipEnd && start < end && membershipEnd >= end;
      })
      .map((item) => item.memberId)
  ).size);
  const attendanceSeries = recentDays.map(({ start, end }) => attendance.filter((item) => inRange(item.checkInTime, start, end)).length);
  const revenueSeries = recentDays.map(({ start, end }) => payments
    .filter((item) => inRange(item.paymentDate, start, end))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0));

  const activity = [
    ...attendance.map((item) => ({ id: `attendance-${item.id}`, type: 'attendance', icon: 'pi pi-sign-in', person: item.memberName, description: 'Checked in', date: eventDate(item, ['checkInTime', 'createdAt']), sortDate: eventTimestamp(item, ['checkInTime', 'createdAt']) })),
    ...payments.map((item) => ({ id: `payment-${item.id}`, type: 'payment', icon: 'pi pi-indian-rupee', person: item.memberName, description: 'Payment received', amount: Number(item.amount || 0), date: eventDate(item, ['createdAt', 'paymentDate']), sortDate: eventTimestamp(item, ['createdAt', 'paymentDate']) })),
    ...memberships.map((item) => ({ id: `membership-${item.id}`, type: 'membership', icon: 'pi pi-refresh', person: item.memberName, description: 'Membership added or renewed', date: eventDate(item, ['createdAt', 'startDate']), sortDate: eventTimestamp(item, ['createdAt', 'startDate']) })),
    ...members.map((item) => ({ id: `member-${item.id}`, type: 'member', icon: 'pi pi-user-plus', person: item.fullName, description: 'New member registered', date: eventDate(item, ['createdAt', 'joiningDate']), sortDate: eventTimestamp(item, ['createdAt', 'joiningDate']) }))
  ]
    .filter((item) => item.date)
    .sort((first, second) => second.sortDate - first.sortDate)
    .slice(0, 7);

  return {
    activeMembers,
    todayVisits: todayAttendance.length,
    monthlyRevenue: currentRevenue,
    activeMembersTrend: trend(activeMembers, previousActiveMembers, 'vs last month'),
    visitsTrend: trend(todayAttendance.length, yesterdayAttendance.length, 'vs yesterday'),
    revenueTrend: trend(currentRevenue, previousRevenue, 'vs last month'),
    attendanceMonthTrend: trend(currentMonthAttendance.length, previousMonthAttendance.length, 'vs last month'),
    hourly: hourly.map((slot) => ({ ...slot, height: Math.max((slot.count / maxHourly) * 100, slot.count ? 12 : 3) })),
    peakLabel: peak.count ? peak.label : 'Not available',
    currentlyInside: canShowCurrentlyInside ? currentlyInsideRecords : null,
    activity,
    membershipRevenue,
    ptRevenue,
    activePtCount: activePt.length,
    ptExpiringCount: ptExpiring.length,
    momentumSeries: {
      members: normalizeSeries(memberSeries),
      attendance: normalizeSeries(attendanceSeries),
      revenue: normalizeSeries(revenueSeries)
    }
  };
}