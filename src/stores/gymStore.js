import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { ATTENDANCE_SOURCE, MEMBER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '../constants/domain';
import { attendanceSeed } from '../services/mockData/attendance';
import { membersSeed } from '../services/mockData/members';
import { membershipPlansSeed } from '../services/mockData/membershipPlans';
import { membershipsSeed } from '../services/mockData/memberships';
import { paymentsSeed } from '../services/mockData/payments';
import { trainersSeed } from '../services/mockData/trainers';

function deepClone(data) {
  return JSON.parse(JSON.stringify(data));
}

function normalizeDate(dateValue) {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
}

function diffDays(fromDate, toDate) {
  const dayMs = 24 * 60 * 60 * 1000;
  const diff = normalizeDate(toDate).getTime() - normalizeDate(fromDate).getTime();
  return Math.floor(diff / dayMs);
}

function addDuration(startDate, duration, durationUnit) {
  const date = new Date(startDate);

  if (durationUnit === 'Months') {
    date.setMonth(date.getMonth() + Number(duration));
    return date;
  }

  if (durationUnit === 'Years') {
    date.setFullYear(date.getFullYear() + Number(duration));
    return date;
  }

  date.setDate(date.getDate() + Number(duration));
  return date;
}

function toIsoDate(dateValue) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

export const useGymStore = defineStore('gym', () => {
  const members = ref(deepClone(membersSeed));
  const trainers = ref(deepClone(trainersSeed));
  const membershipPlans = ref(deepClone(membershipPlansSeed));
  const memberships = ref(deepClone(membershipsSeed));
  const attendance = ref(deepClone(attendanceSeed));
  const payments = ref(deepClone(paymentsSeed));
  const receiptCounter = ref(124);

  const trainersById = computed(() => {
    return Object.fromEntries(trainers.value.map((trainer) => [trainer.id, trainer]));
  });

  const plansById = computed(() => {
    return Object.fromEntries(membershipPlans.value.map((plan) => [plan.id, plan]));
  });

  function getLatestMembership(memberId) {
    const records = memberships.value
      .filter((entry) => entry.memberId === memberId)
      .sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

    return records[0] || null;
  }

  function getMembershipStatusFromRecord(membershipRecord, baseStatus) {
    if (baseStatus === MEMBER_STATUS.INACTIVE) {
      return MEMBER_STATUS.INACTIVE;
    }

    if (!membershipRecord) {
      return MEMBER_STATUS.EXPIRED;
    }

    const daysRemaining = diffDays(new Date(), new Date(membershipRecord.endDate));

    if (daysRemaining < 0) {
      return MEMBER_STATUS.EXPIRED;
    }

    if (daysRemaining <= 7) {
      return MEMBER_STATUS.EXPIRING_SOON;
    }

    return MEMBER_STATUS.ACTIVE;
  }

  const membersDetailed = computed(() => {
    return members.value.map((member) => {
      const latestMembership = getLatestMembership(member.id);
      const trainer = trainersById.value[member.trainerId] || null;
      const membershipPlan = latestMembership ? plansById.value[latestMembership.planId] : null;
      const status = getMembershipStatusFromRecord(latestMembership, member.status);
      const outstandingBalance = latestMembership
        ? Math.max(latestMembership.finalAmount - latestMembership.amountPaid, 0)
        : 0;

      const memberAttendance = attendance.value
        .filter((entry) => entry.memberId === member.id)
        .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));

      const thisMonthVisits = memberAttendance.filter((entry) => {
        const checkDate = new Date(entry.checkInTime);
        const now = new Date();
        return checkDate.getMonth() === now.getMonth() && checkDate.getFullYear() === now.getFullYear();
      }).length;

      return {
        ...member,
        trainerName: trainer?.fullName || 'Unassigned',
        latestMembership,
        membershipPlanName: membershipPlan?.name || 'No Plan',
        membershipExpiryDate: latestMembership?.endDate || null,
        membershipStatus: status,
        outstandingBalance,
        totalVisits: memberAttendance.length,
        visitsThisMonth: thisMonthVisits,
        lastVisitAt: memberAttendance[0]?.checkInTime || null
      };
    });
  });

  const membershipsDetailed = computed(() => {
    return memberships.value
      .map((record) => {
        const member = membersDetailed.value.find((item) => item.id === record.memberId);
        const plan = plansById.value[record.planId];
        const daysRemaining = diffDays(new Date(), new Date(record.endDate));

        return {
          ...record,
          memberName: member?.fullName || 'Unknown Member',
          memberCode: member?.memberCode || '-',
          memberStatus: member?.membershipStatus || MEMBER_STATUS.EXPIRED,
          planName: plan?.name || 'Unknown Plan',
          daysRemaining
        };
      })
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  });

  const attendanceDetailed = computed(() => {
    return attendance.value
      .map((entry) => {
        const member = membersDetailed.value.find((item) => item.id === entry.memberId);
        return {
          ...entry,
          memberName: member?.fullName || 'Unknown Member',
          memberCode: member?.memberCode || '-',
          memberStatus: member?.membershipStatus || MEMBER_STATUS.EXPIRED
        };
      })
      .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));
  });

  const paymentsDetailed = computed(() => {
    return payments.value
      .map((entry) => {
        const member = membersDetailed.value.find((item) => item.id === entry.memberId);
        const membership = membershipsDetailed.value.find((item) => item.id === entry.membershipId);

        return {
          ...entry,
          memberName: member?.fullName || 'Unknown Member',
          memberCode: member?.memberCode || '-',
          membershipPlanName: membership?.planName || 'Membership',
          outstandingBalance: member?.outstandingBalance || 0
        };
      })
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
  });

  const dashboardStats = computed(() => {
    const today = toIsoDate(new Date());

    const todayAttendance = attendanceDetailed.value.filter((entry) =>
      toIsoDate(entry.checkInTime) === today
    );

    const collectionThisMonth = paymentsDetailed.value
      .filter((entry) => {
        const date = new Date(entry.paymentDate);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, entry) => sum + entry.amount, 0);

    const pendingAmount = membersDetailed.value.reduce(
      (sum, member) => sum + member.outstandingBalance,
      0
    );

    return {
      todayCheckIns: todayAttendance.length,
      activeMembers: membersDetailed.value.filter((member) => member.membershipStatus === MEMBER_STATUS.ACTIVE)
        .length,
      expiringSoon: membersDetailed.value.filter(
        (member) => member.membershipStatus === MEMBER_STATUS.EXPIRING_SOON
      ).length,
      expiredMemberships: membersDetailed.value.filter(
        (member) => member.membershipStatus === MEMBER_STATUS.EXPIRED
      ).length,
      pendingPayments: membersDetailed.value.filter((member) => member.outstandingBalance > 0).length,
      inactiveMembers: membersDetailed.value.filter((member) => member.membershipStatus === MEMBER_STATUS.INACTIVE)
        .length,
      monthlyCollection: collectionThisMonth,
      totalPendingAmount: pendingAmount
    };
  });

  function getMemberById(memberId) {
    return membersDetailed.value.find((member) => member.id === memberId) || null;
  }

  function getMemberMemberships(memberId) {
    return membershipsDetailed.value.filter((membership) => membership.memberId === memberId);
  }

  function getMemberAttendance(memberId) {
    return attendanceDetailed.value.filter((entry) => entry.memberId === memberId);
  }

  function getMemberPayments(memberId) {
    return paymentsDetailed.value.filter((entry) => entry.memberId === memberId);
  }

  function generateId(prefix) {
    return `${prefix}-${Date.now()}`;
  }

  function generateMemberCode() {
    return `MBR-2026-${String(members.value.length + 1).padStart(3, '0')}`;
  }

  function generateReceiptNumber() {
    const serial = String(receiptCounter.value).padStart(6, '0');
    receiptCounter.value += 1;
    return `GYM-2026-${serial}`;
  }

  function getStatusFromAmounts(finalAmount, paidAmount) {
    if (paidAmount >= finalAmount) {
      return PAYMENT_STATUS.PAID;
    }

    if (paidAmount > 0) {
      return PAYMENT_STATUS.PARTIAL;
    }

    return PAYMENT_STATUS.PENDING;
  }

  function addMember(payload) {
    const memberId = generateId('member');
    const now = new Date().toISOString();

    const member = {
      id: memberId,
      memberCode: generateMemberCode(),
      fullName: payload.fullName,
      mobile: payload.mobile,
      email: payload.email,
      gender: payload.gender,
      dateOfBirth: payload.dateOfBirth,
      address: payload.address,
      emergencyContactName: payload.emergencyContactName,
      emergencyContactNumber: payload.emergencyContactNumber,
      joiningDate: payload.joiningDate,
      trainerId: payload.trainerId,
      deviceUserId: payload.deviceUserId,
      status: MEMBER_STATUS.ACTIVE
    };

    members.value.unshift(member);

    const plan = plansById.value[payload.planId];
    const discount = Number(payload.discount || 0);
    const finalAmount = Math.max(plan.price - discount, 0);
    const paidAmount = Number(payload.amountPaid || 0);
    const endDate = addDuration(payload.joiningDate, plan.duration - 1, plan.durationUnit);

    const membershipId = generateId('ms');
    memberships.value.unshift({
      id: membershipId,
      memberId,
      planId: payload.planId,
      startDate: payload.joiningDate,
      endDate: toIsoDate(endDate),
      originalAmount: plan.price,
      discount,
      finalAmount,
      amountPaid: paidAmount,
      status: diffDays(new Date(), endDate) < 0 ? 'EXPIRED' : 'ACTIVE',
      createdAt: now,
      updatedAt: now
    });

    if (paidAmount > 0) {
      payments.value.unshift({
        id: generateId('pay'),
        receiptNumber: generateReceiptNumber(),
        memberId,
        membershipId,
        amount: paidAmount,
        paymentMode: payload.paymentMode || PAYMENT_METHOD.CASH,
        status: getStatusFromAmounts(finalAmount, paidAmount),
        paymentDate: payload.joiningDate,
        notes: 'Initial payment at registration'
      });
    }

    return memberId;
  }

  function updateMember(memberId, payload) {
    const index = members.value.findIndex((member) => member.id === memberId);

    if (index === -1) {
      return false;
    }

    members.value[index] = {
      ...members.value[index],
      fullName: payload.fullName,
      mobile: payload.mobile,
      email: payload.email,
      gender: payload.gender,
      dateOfBirth: payload.dateOfBirth,
      address: payload.address,
      emergencyContactName: payload.emergencyContactName,
      emergencyContactNumber: payload.emergencyContactNumber,
      joiningDate: payload.joiningDate,
      trainerId: payload.trainerId,
      deviceUserId: payload.deviceUserId
    };

    return true;
  }

  function renewMembership(payload) {
    const plan = plansById.value[payload.planId];
    const discount = Number(payload.discount || 0);
    const finalAmount = Math.max(plan.price - discount, 0);
    const paidAmount = Number(payload.amountPaid || 0);
    const startDate = payload.startDate;
    const endDate = addDuration(startDate, plan.duration - 1, plan.durationUnit);
    const now = new Date().toISOString();
    const membershipId = generateId('ms');

    memberships.value.unshift({
      id: membershipId,
      memberId: payload.memberId,
      planId: payload.planId,
      startDate,
      endDate: toIsoDate(endDate),
      originalAmount: plan.price,
      discount,
      finalAmount,
      amountPaid: paidAmount,
      status: diffDays(new Date(), endDate) < 0 ? 'EXPIRED' : 'ACTIVE',
      createdAt: now,
      updatedAt: now
    });

    if (paidAmount > 0) {
      payments.value.unshift({
        id: generateId('pay'),
        receiptNumber: generateReceiptNumber(),
        memberId: payload.memberId,
        membershipId,
        amount: paidAmount,
        paymentMode: payload.paymentMode || PAYMENT_METHOD.CASH,
        status: getStatusFromAmounts(finalAmount, paidAmount),
        paymentDate: payload.startDate,
        notes: 'Membership renewal payment'
      });
    }

    return membershipId;
  }

  function recordPayment(payload) {
    const membership = memberships.value.find((record) => record.id === payload.membershipId);

    if (!membership) {
      return null;
    }

    membership.amountPaid += Number(payload.amount);
    membership.updatedAt = new Date().toISOString();

    const paymentRecord = {
      id: generateId('pay'),
      receiptNumber: generateReceiptNumber(),
      memberId: payload.memberId,
      membershipId: payload.membershipId,
      amount: Number(payload.amount),
      paymentMode: payload.paymentMode,
      status: getStatusFromAmounts(membership.finalAmount, membership.amountPaid),
      paymentDate: payload.paymentDate,
      notes: payload.notes || ''
    };

    payments.value.unshift(paymentRecord);
    return paymentRecord;
  }

  function addManualAttendance(payload) {
    attendance.value.unshift({
      id: generateId('att'),
      memberId: payload.memberId,
      checkInTime: payload.checkInTime,
      checkOutTime: payload.checkOutTime || null,
      source: ATTENDANCE_SOURCE.MANUAL,
      note: payload.note || '',
      membershipStatus: payload.membershipStatus,
      createdAt: new Date().toISOString()
    });
  }

  function createPlan(payload) {
    membershipPlans.value.unshift({
      id: generateId('plan'),
      name: payload.name,
      price: Number(payload.price),
      duration: Number(payload.duration),
      durationUnit: payload.durationUnit,
      description: payload.description,
      active: payload.active
    });
  }

  function updatePlan(planId, payload) {
    const index = membershipPlans.value.findIndex((plan) => plan.id === planId);

    if (index === -1) {
      return false;
    }

    membershipPlans.value[index] = {
      ...membershipPlans.value[index],
      name: payload.name,
      price: Number(payload.price),
      duration: Number(payload.duration),
      durationUnit: payload.durationUnit,
      description: payload.description,
      active: payload.active
    };

    return true;
  }

  function togglePlanActive(planId) {
    const target = membershipPlans.value.find((plan) => plan.id === planId);

    if (target) {
      target.active = !target.active;
    }
  }

  function createTrainer(payload) {
    trainers.value.unshift({
      id: generateId('trainer'),
      fullName: payload.fullName,
      mobile: payload.mobile,
      email: payload.email,
      gender: payload.gender,
      specialization: payload.specialization,
      joiningDate: payload.joiningDate,
      status: payload.status
    });
  }

  function updateTrainer(trainerId, payload) {
    const index = trainers.value.findIndex((trainer) => trainer.id === trainerId);

    if (index === -1) {
      return false;
    }

    trainers.value[index] = {
      ...trainers.value[index],
      fullName: payload.fullName,
      mobile: payload.mobile,
      email: payload.email,
      gender: payload.gender,
      specialization: payload.specialization,
      joiningDate: payload.joiningDate,
      status: payload.status
    };

    return true;
  }

  function toggleTrainerStatus(trainerId) {
    const trainer = trainers.value.find((item) => item.id === trainerId);
    if (trainer) {
      trainer.status = trainer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    }
  }

  return {
    members,
    trainers,
    membershipPlans,
    memberships,
    attendance,
    payments,
    membersDetailed,
    membershipsDetailed,
    attendanceDetailed,
    paymentsDetailed,
    dashboardStats,
    getMemberById,
    getMemberMemberships,
    getMemberAttendance,
    getMemberPayments,
    getLatestMembership,
    addMember,
    updateMember,
    renewMembership,
    recordPayment,
    addManualAttendance,
    createPlan,
    updatePlan,
    togglePlanActive,
    createTrainer,
    updateTrainer,
    toggleTrainerStatus
  };
});
