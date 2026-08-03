/**
 * Dashboard Service
 * Handles dashboard statistics and aggregation
 */

import { queryDocuments } from '../../firebase/firestore';
import {
  getTodayAttendanceCount,
  getAttendanceByDate
} from './attendanceService';
import {
  getActiveMembersCount,
  getMembersExpiringsSoon
} from './memberService';
import {
  getTodayCollection,
  getPendingPayments
} from './paymentService';
import {
  getExpiredMemberships,
  getExpiringMemberships,
  getMembershipCountByStatus
} from './membershipService';

/**
 * Get dashboard data
 * @param {string} gymId
 * @returns {Promise<Object>}
 */
export const getDashboardData = async (gymId) => {
  try {
    const [
      todayCheckIns,
      activeMembers,
      expiringMemberships,
      todayCollection,
      expiredMemberships,
      pendingPayments,
      todayAttendance
    ] = await Promise.all([
      getTodayAttendanceCount(gymId),
      getActiveMembersCount(gymId),
      getExpiringMemberships(gymId, 7),
      getTodayCollection(gymId),
      getExpiredMemberships(gymId),
      getPendingPayments(gymId),
      getAttendanceByDate(gymId, new Date().toISOString().split('T')[0])
    ]);

    return {
      todayCheckIns,
      activeMembers,
      expiringMemberships: expiringMemberships.length,
      todayCollection,
      expiredMemberships: expiredMemberships.length,
      pendingPayments: pendingPayments.length,
      todayAttendance: todayAttendance.slice(0, 10) // Recent 10 records
    };
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    throw error;
  }
};

/**
 * Get action required data
 * @param {string} gymId
 * @returns {Promise<Object>}
 */
export const getActionRequired = async (gymId) => {
  try {
    const [
      expiredMemberships,
      expiringMemberships,
      pendingPayments,
      inactiveMembers
    ] = await Promise.all([
      getExpiredMemberships(gymId),
      getExpiringMemberships(gymId, 7),
      getPendingPayments(gymId),
      queryDocuments(
        `gyms/${gymId}/members`,
        [['status', '==', 'INACTIVE']]
      )
    ]);

    return {
      expiredCount: expiredMemberships.length,
      expiringCount: expiringMemberships.length,
      pendingPaymentsCount: pendingPayments.length,
      inactiveMembersCount: inactiveMembers.length,
      totalActionItems: expiredMemberships.length + expiringMemberships.length + pendingPayments.length + inactiveMembers.length
    };
  } catch (error) {
    console.error('Failed to load action required data:', error);
    throw error;
  }
};

/**
 * Get attendance trends (last 7 days)
 * @param {string} gymId
 * @returns {Promise<Array>}
 */
export const getAttendanceTrends = async (gymId) => {
  try {
    const trends = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = await getTodayAttendanceCount(gymId);
      trends.push({
        date: dateStr,
        count
      });
    }

    return trends;
  } catch (error) {
    console.error('Failed to load attendance trends:', error);
    return [];
  }
};

/**
 * Get membership statistics
 * @param {string} gymId
 * @returns {Promise<Object>}
 */
export const getMembershipStats = async (gymId) => {
  try {
    const [
      activeCount,
      expiredCount,
      cancelledCount,
      frozenCount
    ] = await Promise.all([
      getMembershipCountByStatus(gymId, 'ACTIVE'),
      getMembershipCountByStatus(gymId, 'EXPIRED'),
      getMembershipCountByStatus(gymId, 'CANCELLED'),
      getMembershipCountByStatus(gymId, 'FROZEN')
    ]);

    return {
      active: activeCount,
      expired: expiredCount,
      cancelled: cancelledCount,
      frozen: frozenCount,
      total: activeCount + expiredCount + cancelledCount + frozenCount
    };
  } catch (error) {
    console.error('Failed to load membership stats:', error);
    throw error;
  }
};
