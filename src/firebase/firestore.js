// Firestore utilities
// Reusable functions for Firestore operations

import {
  collection,
  query,
  where,
  limit,
  orderBy,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Add a document with auto-generated ID
 * @param {string} collectionName
 * @param {Object} data
 * @returns {Promise<string>} Document ID
 */
export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    throw formatFirestoreError(error);
  }
};

/**
 * Get a single document by ID
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<Object>}
 */
export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    throw formatFirestoreError(error);
  }
};

/**
 * Query documents with filters
 * @param {string} collectionName
 * @param {Array} whereConditions - Array of [field, operator, value]
 * @param {Object} options - { orderByField, orderDirection, limitCount }
 * @returns {Promise<Array>}
 */
export const queryDocuments = async (
  collectionName,
  whereConditions = [],
  options = {}
) => {
  try {
    const { orderByField, orderDirection = 'asc', limitCount } = options;

    let q = collection(db, collectionName);
    const constraints = [];

    // Add where conditions
    whereConditions.forEach(([field, operator, value]) => {
      constraints.push(where(field, operator, value));
    });

    // Add orderBy
    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDirection));
    }

    // Add limit
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    q = query(q, ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw formatFirestoreError(error);
  }
};

/**
 * Update a document
 * @param {string} collectionName
 * @param {string} docId
 * @param {Object} data
 * @returns {Promise<void>}
 */
export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw formatFirestoreError(error);
  }
};

/**
 * Delete a document
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<void>}
 */
export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    throw formatFirestoreError(error);
  }
};

/**
 * Batch update documents
 * @param {Array} operations - Array of { collectionName, docId, data, type: 'set'|'update'|'delete' }
 * @returns {Promise<void>}
 */
export const batchUpdate = async (operations) => {
  try {
    const batch = writeBatch(db);

    operations.forEach(({ collectionName, docId, data, type }) => {
      const docRef = doc(db, collectionName, docId);

      if (type === 'set') {
        batch.set(docRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      } else if (type === 'update') {
        batch.update(docRef, { ...data, updatedAt: serverTimestamp() });
      } else if (type === 'delete') {
        batch.delete(docRef);
      }
    });

    await batch.commit();
  } catch (error) {
    throw formatFirestoreError(error);
  }
};

/**
 * Convert Firebase errors to user-friendly messages
 * @param {Error} error
 * @returns {Error}
 */
export const formatFirestoreError = (error) => {
  const errorMap = {
    'permission-denied': 'You don\'t have permission to perform this action.',
    'not-found': 'Document not found.',
    'already-exists': 'This document already exists.',
    'failed-precondition': 'Operation cannot be performed in the current state.',
    'internal': 'An internal error occurred.',
    'unavailable': 'Service temporarily unavailable. Please try again.',
    'data-loss': 'Unrecoverable data loss or corruption.',
    'unauthenticated': 'You must be logged in to perform this action.',
    'invalid-argument': 'Invalid argument provided.',
  };

  const message = errorMap[error.code] || error.message || 'A database error occurred';
  const firestoreError = new Error(message);
  firestoreError.code = error.code;
  return firestoreError;
};

/**
 * Get current timestamp
 * @returns {Object} Firebase server timestamp
 */
export const getServerTimestamp = () => {
  return serverTimestamp();
};

/**
 * Convert Firestore timestamp to JS Date
 * @param {Object} timestamp - Firestore timestamp
 * @returns {Date}
 */
export const timestampToDate = (timestamp) => {
  if (!timestamp) return null;
  return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
};

export default db;
