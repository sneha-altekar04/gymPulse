import { addDocument, queryDocuments, updateDocument } from '../../firebase/firestore';
import { PLAN_STATUS } from '../../constants/domain';

const collectionPath = (gymId) => `gyms/${gymId}/personalTrainingPlans`;

export async function getPersonalTrainingPlans(gymId) {
  return queryDocuments(collectionPath(gymId), []);
}

export async function createPersonalTrainingPlan(gymId, payload, userId) {
  return addDocument(collectionPath(gymId), {
    gymId,
    name: payload.name,
    duration: Number(payload.duration),
    durationUnit: payload.durationUnit,
    price: Number(payload.price),
    description: payload.description || '',
    status: payload.status || PLAN_STATUS.ACTIVE,
    createdBy: userId,
    updatedBy: userId
  });
}

export async function updatePersonalTrainingPlan(gymId, planId, payload, userId) {
  await updateDocument(collectionPath(gymId), planId, {
    ...payload,
    ...(payload.duration !== undefined ? { duration: Number(payload.duration) } : {}),
    ...(payload.price !== undefined ? { price: Number(payload.price) } : {}),
    gymId,
    updatedBy: userId
  });
}

export async function setPersonalTrainingPlanStatus(gymId, planId, status, userId) {
  return updatePersonalTrainingPlan(gymId, planId, { status }, userId);
}