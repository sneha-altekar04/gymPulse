/**
 * Member Service
 * Handles all member-related Firebase Firestore operations
 */

import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments
} from '../../firebase/firestore';

/**
 * Add new member
 * @param {string} gymId
 * @param {Object} memberData
 * @returns {Promise<string>} Member ID
 */
export const addMember = async (gymId, memberData) => {
  const docId = await addDocument(`gyms/${gymId}/members`, {
    ...memberData,
    gymId,
    status: memberData.status || 'ACTIVE',
    joiningDate: memberData.joiningDate || new Date()
  });
  return docId;
};

/**
 * Get member by ID
 * @param {string} gymId
 * @param {string} memberId
 * @returns {Promise<Object>}
 */
export const getMember = async (gymId, memberId) => {
  return getDocument(`gyms/${gymId}/members`, memberId);
};

/**
 * Get all members for a gym
 * @param {string} gymId
 * @param {Object} options - { orderByField, orderDirection, limitCount }
 * @returns {Promise<Array>}
 */
export const getMembers = async (gymId, options = {}) => {
  return queryDocuments(
    `gyms/${gymId}/members`,
    [['status', '!=', 'DELETED']],
    options
  );
};

/**
 * Search members
 * @param {string} gymId
 * @param {string} searchTerm
 * @returns {Promise<Array>}
 */
export const searchMembers = async (gymId, searchTerm) => {
  // Note: This is a basic client-side search
  // For production, consider using Algolia or Meilisearch
  const members = await getMembers(gymId);
  const term = searchTerm.toLowerCase();
  
  return members.filter(member =>
    member.firstName?.toLowerCase().includes(term) ||
    member.lastName?.toLowerCase().includes(term) ||
    member.fullName?.toLowerCase().includes(term) ||
    member.phone?.includes(term) ||
    member.email?.toLowerCase().includes(term) ||
    member.memberCode?.includes(term)
  );
};

/**
 * Update member
 * @param {string} gymId
 * @param {string} memberId
 * @param {Object} memberData
 * @returns {Promise<void>}
 */
export const updateMember = async (gymId, memberId, memberData) => {
  await updateDocument(`gyms/${gymId}/members`, memberId, memberData);
};

/**
 * Delete member (soft delete)
 * @param {string} gymId
 * @param {string} memberId
 * @returns {Promise<void>}
 */
export const deleteMember = async (gymId, memberId) => {
  await updateDocument(`gyms/${gymId}/members`, memberId, {
    status: 'DELETED',
    deletedAt: new Date()
  });
};

/**
 * Get members by status
 * @param {string} gymId
 * @param {string} status
 * @returns {Promise<Array>}
 */
export const getMembersByStatus = async (gymId, status) => {
  return queryDocuments(
    `gyms/${gymId}/members`,
    [['status', '==', status]]
  );
};

/**
 * Get members expiring soon
 * @param {string} gymId
 * @param {number} daysFromNow - Check expiry within this many days
 * @returns {Promise<Array>}
 */
export const getMembersExpiringsSoon = async (gymId, daysFromNow = 7) => {
  const today = new Date();
  const futureDate = new Date(today.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
  
  // This is a simplified query; you may need to adjust based on your membership structure
  const members = await queryDocuments(
    `gyms/${gymId}/members`,
    [['status', '==', 'ACTIVE']]
  );
  
  // Filter client-side for expiring members
  return members.filter(member => {
    if (!member.membershipExpiry) return false;
    const expiryDate = new Date(member.membershipExpiry);
    return expiryDate >= today && expiryDate <= futureDate;
  });
};

/**
 * Get active members count
 * @param {string} gymId
 * @returns {Promise<number>}
 */
export const getActiveMembersCount = async (gymId) => {
  const members = await getMembersByStatus(gymId, 'ACTIVE');
  return members.length;
};

/**
 * Bulk update members
 * @param {string} gymId
 * @param {Array} memberIds
 * @param {Object} updateData
 * @returns {Promise<void>}
 */
export const bulkUpdateMembers = async (gymId, memberIds, updateData) => {
  const batch = [];
  memberIds.forEach(memberId => {
    batch.push({
      collectionName: `gyms/${gymId}/members`,
      docId: memberId,
      data: updateData,
      type: 'update'
    });
  });
  // This will need the batchUpdate function from firestore.js
};
