/**
 * Membership Plan Service
 * Handles membership plan CRUD operations
 */

import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments
} from '../../firebase/firestore';

/**
 * Add new membership plan
 * @param {string} gymId
 * @param {Object} planData
 * @returns {Promise<string>} Plan ID
 */
export const addPlan = async (gymId, planData) => {
  return addDocument(`gyms/${gymId}/membershipPlans`, {
    ...planData,
    gymId,
    status: planData.status || 'ACTIVE'
  });
};

/**
 * Get plan by ID
 * @param {string} gymId
 * @param {string} planId
 * @returns {Promise<Object>}
 */
export const getPlan = async (gymId, planId) => {
  return getDocument(`gyms/${gymId}/membershipPlans`, planId);
};

/**
 * Get all plans for a gym
 * @param {string} gymId
 * @returns {Promise<Array>}
 */
export const getPlans = async (gymId) => {
  return queryDocuments(
    `gyms/${gymId}/membershipPlans`,
    [['status', '!=', 'DELETED']]
  );
};

/**
 * Get active plans
 * @param {string} gymId
 * @returns {Promise<Array>}
 */
export const getActivePlans = async (gymId) => {
  return queryDocuments(
    `gyms/${gymId}/membershipPlans`,
    [['status', '==', 'ACTIVE']],
    { orderByField: 'price', orderDirection: 'asc' }
  );
};

/**
 * Update plan
 * @param {string} gymId
 * @param {string} planId
 * @param {Object} planData
 * @returns {Promise<void>}
 */
export const updatePlan = async (gymId, planId, planData) => {
  await updateDocument(`gyms/${gymId}/membershipPlans`, planId, planData);
};

/**
 * Delete plan (soft delete - deactivate)
 * @param {string} gymId
 * @param {string} planId
 * @returns {Promise<void>}
 */
export const deletePlan = async (gymId, planId) => {
  await updateDocument(`gyms/${gymId}/membershipPlans`, planId, {
    status: 'DELETED'
  });
};

/**
 * Get plan details with usage count
 * @param {string} gymId
 * @param {string} planId
 * @returns {Promise<Object>}
 */
export const getPlanWithUsageCount = async (gymId, planId) => {
  const plan = await getPlan(gymId, planId);
  // TODO: Query memberships to get count
  return {
    ...plan,
    usageCount: 0
  };
};
