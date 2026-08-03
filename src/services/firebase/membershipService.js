/**
 * Membership Service
 * Handles membership-related Firestore operations
 */

import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments
} from '../../firebase/firestore';

/**
 * Add new membership
 * @param {string} gymId
 * @param {Object} membershipData
 * @returns {Promise<string>} Membership ID
 */
export const addMembership = async (gymId, membershipData) => {
  return addDocument(`gyms/${gymId}/memberships`, {
    ...membershipData,
    gymId,
    status: membershipData.status || 'ACTIVE'
  });
};

/**
 * Get membership by ID
 * @param {string} gymId
 * @param {string} membershipId
 * @returns {Promise<Object>}
 */
export const getMembership = async (gymId, membershipId) => {
  return getDocument(`gyms/${gymId}/memberships`, membershipId);
};

/**
 * Get memberships for a member
 * @param {string} gymId
 * @param {string} memberId
 * @returns {Promise<Array>}
 */
export const getMembershipsByMember = async (gymId, memberId) => {
  return queryDocuments(
    `gyms/${gymId}/memberships`,
    [['memberId', '==', memberId]],
    { orderByField: 'startDate', orderDirection: 'desc' }
  );
};

/**
 * Get current active membership for a member
 * @param {string} gymId
 * @param {string} memberId
 * @returns {Promise<Object|null>}
 */
export const getCurrentMembership = async (gymId, memberId) => {
  const memberships = await getMembershipsByMember(gymId, memberId);
  return memberships.find(m => m.status === 'ACTIVE') || null;
};

/**
 * Get expired memberships
 * @param {string} gymId
 * @returns {Promise<Array>}
 */
export const getExpiredMemberships = async (gymId) => {
  return queryDocuments(
    `gyms/${gymId}/memberships`,
    [['status', '==', 'EXPIRED']]
  );
};

/**
 * Get expiring memberships within days
 * @param {string} gymId
 * @param {number} daysFromNow
 * @returns {Promise<Array>}
 */
export const getExpiringMemberships = async (gymId, daysFromNow = 7) => {
  const today = new Date();
  const futureDate = new Date(today.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
  
  const memberships = await queryDocuments(
    `gyms/${gymId}/memberships`,
    [['status', '==', 'ACTIVE']]
  );
  
  return memberships.filter(m => {
    if (!m.endDate) return false;
    const endDate = new Date(m.endDate);
    return endDate >= today && endDate <= futureDate;
  });
};

/**
 * Update membership
 * @param {string} gymId
 * @param {string} membershipId
 * @param {Object} membershipData
 * @returns {Promise<void>}
 */
export const updateMembership = async (gymId, membershipId, membershipData) => {
  await updateDocument(`gyms/${gymId}/memberships`, membershipId, membershipData);
};

/**
 * Renew membership (create new membership record)
 * @param {string} gymId
 * @param {Object} newMembershipData
 * @returns {Promise<string>} New Membership ID
 */
export const renewMembership = async (gymId, newMembershipData) => {
  // Mark old membership as expired
  if (newMembershipData.previousMembershipId) {
    await updateMembership(gymId, newMembershipData.previousMembershipId, {
      status: 'EXPIRED'
    });
  }
  
  // Create new membership
  return addMembership(gymId, newMembershipData);
};

/**
 * Cancel membership
 * @param {string} gymId
 * @param {string} membershipId
 * @returns {Promise<void>}
 */
export const cancelMembership = async (gymId, membershipId) => {
  await updateMembership(gymId, membershipId, {
    status: 'CANCELLED'
  });
};

/**
 * Freeze membership
 * @param {string} gymId
 * @param {string} membershipId
 * @returns {Promise<void>}
 */
export const freezeMembership = async (gymId, membershipId) => {
  await updateMembership(gymId, membershipId, {
    status: 'FROZEN'
  });
};

/**
 * Get membership count by status
 * @param {string} gymId
 * @param {string} status
 * @returns {Promise<number>}
 */
export const getMembershipCountByStatus = async (gymId, status) => {
  const memberships = await queryDocuments(
    `gyms/${gymId}/memberships`,
    [['status', '==', status]]
  );
  return memberships.length;
};
