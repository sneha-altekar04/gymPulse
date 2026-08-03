/**
 * Trainer Service
 * Handles all trainer-related Firestore operations
 */

import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments
} from '../../firebase/firestore';

/**
 * Add new trainer
 * @param {string} gymId
 * @param {Object} trainerData
 * @returns {Promise<string>} Trainer ID
 */
export const addTrainer = async (gymId, trainerData) => {
  return addDocument(`gyms/${gymId}/trainers`, {
    ...trainerData,
    gymId,
    status: trainerData.status || 'ACTIVE'
  });
};

/**
 * Get trainer by ID
 * @param {string} gymId
 * @param {string} trainerId
 * @returns {Promise<Object>}
 */
export const getTrainer = async (gymId, trainerId) => {
  return getDocument(`gyms/${gymId}/trainers`, trainerId);
};

/**
 * Get all trainers for a gym
 * @param {string} gymId
 * @returns {Promise<Array>}
 */
export const getTrainers = async (gymId) => {
  return queryDocuments(
    `gyms/${gymId}/trainers`,
    [['status', '!=', 'DELETED']]
  );
};

/**
 * Get active trainers
 * @param {string} gymId
 * @returns {Promise<Array>}
 */
export const getActiveTrainers = async (gymId) => {
  return queryDocuments(
    `gyms/${gymId}/trainers`,
    [['status', '==', 'ACTIVE']]
  );
};

/**
 * Update trainer
 * @param {string} gymId
 * @param {string} trainerId
 * @param {Object} trainerData
 * @returns {Promise<void>}
 */
export const updateTrainer = async (gymId, trainerId, trainerData) => {
  await updateDocument(`gyms/${gymId}/trainers`, trainerId, trainerData);
};

/**
 * Delete trainer (soft delete)
 * @param {string} gymId
 * @param {string} trainerId
 * @returns {Promise<void>}
 */
export const deleteTrainer = async (gymId, trainerId) => {
  await updateDocument(`gyms/${gymId}/trainers`, trainerId, {
    status: 'DELETED'
  });
};

/**
 * Get trainers assigned to members count
 * @param {string} gymId
 * @param {string} trainerId
 * @returns {Promise<number>}
 */
export const getTrainerAssignedMembersCount = async (gymId, trainerId) => {
  // This would require querying the members collection
  // Implementation depends on your data structure
  return 0;
};
