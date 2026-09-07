import { addDocument, queryDocuments, updateDocument } from '../../firebase/firestore';
import { PERSONAL_TRAINING_STATUS } from '../../constants/domain';

const collectionPath = (gymId) => `gyms/${gymId}/personalTrainingSubscriptions`;

export async function getPersonalTrainingSubscriptions(gymId) {
  return queryDocuments(collectionPath(gymId), []);
}

export async function getMemberPersonalTrainingSubscriptions(gymId, memberId) {
  return queryDocuments(collectionPath(gymId), [['memberId', '==', memberId]]);
}

export async function createPersonalTrainingSubscription(gymId, payload, userId) {
  return addDocument(collectionPath(gymId), {
    ...payload,
    gymId,
    amount: Number(payload.amount),
    amountPaid: Number(payload.amountPaid || 0),
    status: payload.status || PERSONAL_TRAINING_STATUS.ACTIVE,
    createdBy: userId,
    updatedBy: userId
  });
}

export async function updatePersonalTrainingSubscription(gymId, subscriptionId, payload, userId) {
  await updateDocument(collectionPath(gymId), subscriptionId, {
    ...payload,
    gymId,
    updatedBy: userId
  });
}

export async function setPersonalTrainingSubscriptionStatus(gymId, subscriptionId, status, userId) {
  return updatePersonalTrainingSubscription(gymId, subscriptionId, { status }, userId);
}