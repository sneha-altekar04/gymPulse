import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { useAuthStore } from './authStore';
import { queryDocuments, addDocument, updateDocument } from '../firebase/firestore';
import { ATTENDANCE_SOURCE, MEMBER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '../constants/domain';

function normalizeTimestamp(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value.toDate) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function normalizeDoc(doc) {
  const result = { ...doc };
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (val && typeof val === 'object' && typeof val.toDate === 'function') {
      result[key] = val.toDate().toISOString();
    }
  }
  return result;
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
  const authStore = useAuthStore();

  const members = ref([]);
  const trainers = ref([]);
  const membershipPlans = ref([]);
  const memberships = ref([]);
  const attendance = ref([]);
  const payments = ref([]);
  const loading = ref(false);
  const dataLoaded = ref(false);

  function getGymId() {
    return authStore.gymId;
  }

  async function loadData() {
    const gymId = getGymId();
    if (!gymId) return;

    loading.value = true;
    try {
      const [membersData, trainersData, plansData, membershipsData, attendanceData, paymentsData] =
        await Promise.all([
          queryDocuments(`gyms/${gymId}/members`, []),
          queryDocuments(`gyms/${gymId}/trainers`, []),
          queryDocuments(`gyms/${gymId}/membershipPlans`, []),
          queryDocuments(`gyms/${gymId}/memberships`, []),
          queryDocuments(`gyms/${gymId}/attendance`, []),
          queryDocuments(`gyms/${gymId}/payments`, [])
        ]);

      members.value = membersData.map(normalizeDoc);
      trainers.value = trainersData.map(normalizeDoc);
      membershipPlans.value = plansData.map(normalizeDoc);
      memberships.value = membershipsData.map(normalizeDoc);
      attendance.value = attendanceData.map(normalizeDoc);
      payments.value = paymentsData.map(normalizeDoc);
      dataLoaded.value = true;
    } catch (err) {
      console.error('Failed to load gym data:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

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
        ? Math.max((latestMembership.finalAmount || 0) - (latestMembership.amountPaid || 0), 0)
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

  function generateMemberCode() {
    return `MBR-${new Date().getFullYear()}-${String(members.value.length + 1).padStart(3, '0')}`;
  }

  function generateReceiptNumber() {
    const maxSeq = payments.value.reduce((max, p) => {
      if (!p.receiptNumber) return max;
      const parts = p.receiptNumber.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      return num > max ? num : max;
    }, 0);
    const serial = String(maxSeq + 1).padStart(6, '0');
    return `GYM-${new Date().getFullYear()}-${serial}`;
  }

  function getStatusFromAmounts(finalAmount, paidAmount) {
    if (paidAmount >= finalAmount) return PAYMENT_STATUS.PAID;
    if (paidAmount > 0) return PAYMENT_STATUS.PARTIAL;
    return PAYMENT_STATUS.PENDING;
  }

  async function addMember(payload) {
    const gymId = getGymId();
    const now = new Date().toISOString();
    const memberCode = generateMemberCode();

    const memberData = {
      memberCode,
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

    const memberId = await addDocument(`gyms/${gymId}/members`, memberData);
    members.value.unshift({ id: memberId, ...memberData, createdAt: now, updatedAt: now });

    const plan = plansById.value[payload.planId];
    const discount = Number(payload.discount || 0);
    const finalAmount = Math.max(plan.price - discount, 0);
    const paidAmount = Number(payload.amountPaid || 0);
    const endDate = addDuration(payload.joiningDate, plan.duration - 1, plan.durationUnit);

    const msData = {
      memberId,
      planId: payload.planId,
      startDate: payload.joiningDate,
      endDate: toIsoDate(endDate),
      originalAmount: plan.price,
      discount,
      finalAmount,
      amountPaid: paidAmount,
      status: diffDays(new Date(), endDate) < 0 ? 'EXPIRED' : 'ACTIVE'
    };

    const membershipId = await addDocument(`gyms/${gymId}/memberships`, msData);
    memberships.value.unshift({ id: membershipId, ...msData, createdAt: now, updatedAt: now });

    if (paidAmount > 0) {
      const receiptNumber = generateReceiptNumber();
      const payData = {
        memberId,
        membershipId,
        receiptNumber,
        amount: paidAmount,
        paymentMode: payload.paymentMode || PAYMENT_METHOD.CASH,
        status: getStatusFromAmounts(finalAmount, paidAmount),
        paymentDate: payload.joiningDate,
        notes: 'Initial payment at registration'
      };
      const payId = await addDocument(`gyms/${gymId}/payments`, payData);
      payments.value.unshift({ id: payId, ...payData, createdAt: now });
    }

    return memberId;
  }

  async function updateMember(memberId, payload) {
    const gymId = getGymId();
    const updateData = {
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

    await updateDocument(`gyms/${gymId}/members`, memberId, updateData);

    const index = members.value.findIndex((m) => m.id === memberId);
    if (index !== -1) {
      members.value[index] = { ...members.value[index], ...updateData };
    }
    return true;
  }

  async function renewMembership(payload) {
    const gymId = getGymId();
    const now = new Date().toISOString();
    const plan = plansById.value[payload.planId];
    const discount = Number(payload.discount || 0);
    const finalAmount = Math.max(plan.price - discount, 0);
    const paidAmount = Number(payload.amountPaid || 0);
    const startDate = payload.startDate;
    const endDate = addDuration(startDate, plan.duration - 1, plan.durationUnit);

    const msData = {
      memberId: payload.memberId,
      planId: payload.planId,
      startDate,
      endDate: toIsoDate(endDate),
      originalAmount: plan.price,
      discount,
      finalAmount,
      amountPaid: paidAmount,
      status: diffDays(new Date(), endDate) < 0 ? 'EXPIRED' : 'ACTIVE'
    };

    const membershipId = await addDocument(`gyms/${gymId}/memberships`, msData);
    memberships.value.unshift({ id: membershipId, ...msData, createdAt: now, updatedAt: now });

    if (paidAmount > 0) {
      const receiptNumber = generateReceiptNumber();
      const payData = {
        memberId: payload.memberId,
        membershipId,
        receiptNumber,
        amount: paidAmount,
        paymentMode: payload.paymentMode || PAYMENT_METHOD.CASH,
        status: getStatusFromAmounts(finalAmount, paidAmount),
        paymentDate: payload.startDate,
        notes: 'Membership renewal payment'
      };
      const payId = await addDocument(`gyms/${gymId}/payments`, payData);
      payments.value.unshift({ id: payId, ...payData, createdAt: now });
    }

    return membershipId;
  }

  async function recordPayment(payload) {
    const gymId = getGymId();
    const now = new Date().toISOString();
    const membership = memberships.value.find((r) => r.id === payload.membershipId);
    if (!membership) return null;

    const newAmountPaid = (membership.amountPaid || 0) + Number(payload.amount);
    await updateDocument(`gyms/${gymId}/memberships`, payload.membershipId, {
      amountPaid: newAmountPaid
    });
    membership.amountPaid = newAmountPaid;
    membership.updatedAt = now;

    const receiptNumber = generateReceiptNumber();
    const payData = {
      memberId: payload.memberId,
      membershipId: payload.membershipId,
      receiptNumber,
      amount: Number(payload.amount),
      paymentMode: payload.paymentMode,
      status: getStatusFromAmounts(membership.finalAmount, newAmountPaid),
      paymentDate: payload.paymentDate,
      notes: payload.notes || ''
    };
    const payId = await addDocument(`gyms/${gymId}/payments`, payData);
    const paymentRecord = { id: payId, ...payData, createdAt: now };
    payments.value.unshift(paymentRecord);
    return paymentRecord;
  }

  async function addManualAttendance(payload) {
    const gymId = getGymId();
    const now = new Date().toISOString();
    const attData = {
      memberId: payload.memberId,
      checkInTime: payload.checkInTime,
      checkOutTime: payload.checkOutTime || null,
      source: ATTENDANCE_SOURCE.MANUAL,
      note: payload.note || '',
      membershipStatus: payload.membershipStatus
    };
    const attId = await addDocument(`gyms/${gymId}/attendance`, attData);
    attendance.value.unshift({ id: attId, ...attData, createdAt: now });
  }

  async function createPlan(payload) {
    const gymId = getGymId();
    const now = new Date().toISOString();
    const planData = {
      name: payload.name,
      price: Number(payload.price),
      duration: Number(payload.duration),
      durationUnit: payload.durationUnit,
      description: payload.description,
      active: payload.active
    };
    const planId = await addDocument(`gyms/${gymId}/membershipPlans`, planData);
    membershipPlans.value.unshift({ id: planId, ...planData, createdAt: now });
  }

  async function updatePlan(planId, payload) {
    const gymId = getGymId();
    const updateData = {
      name: payload.name,
      price: Number(payload.price),
      duration: Number(payload.duration),
      durationUnit: payload.durationUnit,
      description: payload.description,
      active: payload.active
    };
    await updateDocument(`gyms/${gymId}/membershipPlans`, planId, updateData);

    const index = membershipPlans.value.findIndex((p) => p.id === planId);
    if (index !== -1) {
      membershipPlans.value[index] = { ...membershipPlans.value[index], ...updateData };
    }
    return true;
  }

  async function togglePlanActive(planId) {
    const gymId = getGymId();
    const target = membershipPlans.value.find((p) => p.id === planId);
    if (target) {
      const newActive = !target.active;
      await updateDocument(`gyms/${gymId}/membershipPlans`, planId, { active: newActive });
      target.active = newActive;
    }
  }

  async function createTrainer(payload) {
    const gymId = getGymId();
    const now = new Date().toISOString();
    const trainerData = {
      fullName: payload.fullName,
      mobile: payload.mobile,
      email: payload.email,
      gender: payload.gender,
      specialization: payload.specialization,
      joiningDate: payload.joiningDate,
      status: payload.status
    };
    const trainerId = await addDocument(`gyms/${gymId}/trainers`, trainerData);
    trainers.value.unshift({ id: trainerId, ...trainerData, createdAt: now });
  }

  async function updateTrainer(trainerId, payload) {
    const gymId = getGymId();
    const updateData = {
      fullName: payload.fullName,
      mobile: payload.mobile,
      email: payload.email,
      gender: payload.gender,
      specialization: payload.specialization,
      joiningDate: payload.joiningDate,
      status: payload.status
    };
    await updateDocument(`gyms/${gymId}/trainers`, trainerId, updateData);

    const index = trainers.value.findIndex((t) => t.id === trainerId);
    if (index !== -1) {
      trainers.value[index] = { ...trainers.value[index], ...updateData };
    }
    return true;
  }

  async function toggleTrainerStatus(trainerId) {
    const gymId = getGymId();
    const trainer = trainers.value.find((t) => t.id === trainerId);
    if (trainer) {
      const newStatus = trainer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateDocument(`gyms/${gymId}/trainers`, trainerId, { status: newStatus });
      trainer.status = newStatus;
    }
  }

  async function deactivateMember(memberId) {
    const gymId = getGymId();
    await updateDocument(`gyms/${gymId}/members`, memberId, { status: 'INACTIVE' });
    const index = members.value.findIndex((m) => m.id === memberId);
    if (index !== -1) {
      members.value[index] = { ...members.value[index], status: 'INACTIVE' };
    }
  }

  async function deleteMember(memberId) {
    const gymId = getGymId();
    await updateDocument(`gyms/${gymId}/members`, memberId, { status: 'DELETED' });
    members.value = members.value.filter((m) => m.id !== memberId);
  }

  return {
    members,
    trainers,
    membershipPlans,
    memberships,
    attendance,
    payments,
    loading,
    dataLoaded,
    loadData,
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
    deactivateMember,
    deleteMember,
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
