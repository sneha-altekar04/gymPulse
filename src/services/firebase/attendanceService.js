/**
 * Attendance Service
 * Handles attendance-related Firestore operations
 */

import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments
} from '../../firebase/firestore';

/**
 * Add attendance record
 * @param {string} gymId
 * @param {Object} attendanceData
 * @returns {Promise<string>} Attendance ID
 */
export const addAttendance = async (gymId, attendanceData) => {
  return addDocument(`gyms/${gymId}/attendance`, {
    ...attendanceData,
    gymId,
    date: attendanceData.date || new Date().toISOString().split('T')[0]
  });
};

/**
 * Get attendance record by ID
 * @param {string} gymId
 * @param {string} attendanceId
 * @returns {Promise<Object>}
 */
export const getAttendance = async (gymId, attendanceId) => {
  return getDocument(`gyms/${gymId}/attendance`, attendanceId);
};

/**
 * Get today's attendance
 * @param {string} gymId
 * @returns {Promise<Array>}
 */
export const getTodayAttendance = async (gymId) => {
  const today = new Date().toISOString().split('T')[0];
  return queryDocuments(
    `gyms/${gymId}/attendance`,
    [['date', '==', today]],
    { orderByField: 'checkIn', orderDirection: 'desc' }
  );
};

/**
 * Get attendance for specific date
 * @param {string} gymId
 * @param {string} date - Format: YYYY-MM-DD
 * @returns {Promise<Array>}
 */
export const getAttendanceByDate = async (gymId, date) => {
  return queryDocuments(
    `gyms/${gymId}/attendance`,
    [['date', '==', date]],
    { orderByField: 'checkIn', orderDirection: 'desc' }
  );
};

/**
 * Get member's attendance history
 * @param {string} gymId
 * @param {string} memberId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const getMemberAttendance = async (gymId, memberId, limit = 30) => {
  return queryDocuments(
    `gyms/${gymId}/attendance`,
    [['memberId', '==', memberId]],
    { orderByField: 'date', orderDirection: 'desc', limitCount: limit }
  );
};

/**
 * Get attendance within date range
 * @param {string} gymId
 * @param {string} startDate - Format: YYYY-MM-DD
 * @param {string} endDate - Format: YYYY-MM-DD
 * @returns {Promise<Array>}
 */
export const getAttendanceByDateRange = async (gymId, startDate, endDate) => {
  // Note: Firestore doesn't support range queries with >= and <=
  // This requires client-side filtering or Cloud Functions
  const attendance = await queryDocuments(
    `gyms/${gymId}/attendance`,
    [['date', '>=', startDate]]
  );
  
  return attendance.filter(a => a.date <= endDate);
};

/**
 * Update attendance
 * @param {string} gymId
 * @param {string} attendanceId
 * @param {Object} attendanceData
 * @returns {Promise<void>}
 */
export const updateAttendance = async (gymId, attendanceId, attendanceData) => {
  await updateDocument(`gyms/${gymId}/attendance`, attendanceId, attendanceData);
};

/**
 * Delete attendance record
 * @param {string} gymId
 * @param {string} attendanceId
 * @returns {Promise<void>}
 */
export const deleteAttendance = async (gymId, attendanceId) => {
  await deleteDocument(`gyms/${gymId}/attendance`, attendanceId);
};

/**
 * Get today's attendance count
 * @param {string} gymId
 * @returns {Promise<number>}
 */
export const getTodayAttendanceCount = async (gymId) => {
  const records = await getTodayAttendance(gymId);
  return records.length;
};

/**
 * Check duplicate attendance (within same day by member and source)
 * @param {string} gymId
 * @param {string} memberId
 * @param {string} date
 * @param {string} source - FINGERPRINT or MANUAL
 * @returns {Promise<Object|null>}
 */
export const checkDuplicateAttendance = async (gymId, memberId, date, source) => {
  const records = await queryDocuments(
    `gyms/${gymId}/attendance`,
    [
      ['memberId', '==', memberId],
      ['date', '==', date],
      ['source', '==', source]
    ]
  );
  return records.length > 0 ? records[0] : null;
};

/**
 * Get attendance statistics for date range
 * @param {string} gymId
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<Object>}
 */
export const getAttendanceStats = async (gymId, startDate, endDate) => {
  const attendance = await getAttendanceByDateRange(gymId, startDate, endDate);
  
  const stats = {
    totalRecords: attendance.length,
    bySource: {},
    byDate: {},
    uniqueMembers: new Set()
  };
  
  attendance.forEach(record => {
    // By source
    if (!stats.bySource[record.source]) {
      stats.bySource[record.source] = 0;
    }
    stats.bySource[record.source]++;
    
    // By date
    if (!stats.byDate[record.date]) {
      stats.byDate[record.date] = 0;
    }
    stats.byDate[record.date]++;
    
    // Unique members
    stats.uniqueMembers.add(record.memberId);
  });
  
  stats.uniqueMembersCount = stats.uniqueMembers.size;
  delete stats.uniqueMembers;
  
  return stats;
};
