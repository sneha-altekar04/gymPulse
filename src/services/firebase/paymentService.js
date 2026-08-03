/**
 * Payment Service
 * Handles payment-related Firestore operations
 */

import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments
} from '../../firebase/firestore';
import { getNextReceiptNumber } from '../../utils/receiptGenerator';

/**
 * Add payment record
 * @param {string} gymId
 * @param {Object} paymentData
 * @returns {Promise<string>} Payment ID
 */
export const addPayment = async (gymId, paymentData) => {
  return addDocument(`gyms/${gymId}/payments`, {
    ...paymentData,
    gymId,
    status: paymentData.status || 'PAID',
    paymentDate: paymentData.paymentDate || new Date()
  });
};

/**
 * Get payment by ID
 * @param {string} gymId
 * @param {string} paymentId
 * @returns {Promise<Object>}
 */
export const getPayment = async (gymId, paymentId) => {
  return getDocument(`gyms/${gymId}/payments`, paymentId);
};

/**
 * Get payments for a member
 * @param {string} gymId
 * @param {string} memberId
 * @returns {Promise<Array>}
 */
export const getPaymentsByMember = async (gymId, memberId) => {
  return queryDocuments(
    `gyms/${gymId}/payments`,
    [['memberId', '==', memberId]],
    { orderByField: 'paymentDate', orderDirection: 'desc' }
  );
};

/**
 * Get payments by status
 * @param {string} gymId
 * @param {string} status
 * @returns {Promise<Array>}
 */
export const getPaymentsByStatus = async (gymId, status) => {
  return queryDocuments(
    `gyms/${gymId}/payments`,
    [['status', '==', status]]
  );
};

/**
 * Get pending payments
 * @param {string} gymId
 * @returns {Promise<Array>}
 */
export const getPendingPayments = async (gymId) => {
  return getPaymentsByStatus(gymId, 'PENDING');
};

/**
 * Get payments for date range
 * @param {string} gymId
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<Array>}
 */
export const getPaymentsByDateRange = async (gymId, startDate, endDate) => {
  const payments = await queryDocuments(
    `gyms/${gymId}/payments`,
    [['paymentDate', '>=', startDate]]
  );
  
  return payments.filter(p => p.paymentDate <= endDate);
};

/**
 * Update payment
 * @param {string} gymId
 * @param {string} paymentId
 * @param {Object} paymentData
 * @returns {Promise<void>}
 */
export const updatePayment = async (gymId, paymentId, paymentData) => {
  await updateDocument(`gyms/${gymId}/payments`, paymentId, paymentData);
};

/**
 * Mark payment as paid
 * @param {string} gymId
 * @param {string} paymentId
 * @returns {Promise<void>}
 */
export const markPaymentAsPaid = async (gymId, paymentId) => {
  await updatePayment(gymId, paymentId, {
    status: 'PAID',
    paidAt: new Date()
  });
};

/**
 * Refund payment
 * @param {string} gymId
 * @param {string} paymentId
 * @param {number} refundAmount
 * @returns {Promise<void>}
 */
export const refundPayment = async (gymId, paymentId, refundAmount) => {
  await updatePayment(gymId, paymentId, {
    status: 'REFUNDED',
    refundedAmount: refundAmount,
    refundedAt: new Date()
  });
};

/**
 * Delete payment (soft delete)
 * @param {string} gymId
 * @param {string} paymentId
 * @returns {Promise<void>}
 */
export const deletePayment = async (gymId, paymentId) => {
  await updatePayment(gymId, paymentId, {
    status: 'DELETED'
  });
};

/**
 * Get collection summary for date range
 * @param {string} gymId
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<Object>}
 */
export const getCollectionSummary = async (gymId, startDate, endDate) => {
  const payments = await getPaymentsByDateRange(gymId, startDate, endDate);
  
  const summary = {
    totalAmount: 0,
    totalCount: 0,
    byStatus: {},
    byPaymentMode: {}
  };
  
  payments.forEach(payment => {
    if (payment.status !== 'DELETED' && payment.status !== 'REFUNDED') {
      summary.totalAmount += payment.amount || 0;
      summary.totalCount++;
      
      // By status
      if (!summary.byStatus[payment.status]) {
        summary.byStatus[payment.status] = { count: 0, amount: 0 };
      }
      summary.byStatus[payment.status].count++;
      summary.byStatus[payment.status].amount += payment.amount || 0;
      
      // By payment mode
      if (!summary.byPaymentMode[payment.paymentMode]) {
        summary.byPaymentMode[payment.paymentMode] = { count: 0, amount: 0 };
      }
      summary.byPaymentMode[payment.paymentMode].count++;
      summary.byPaymentMode[payment.paymentMode].amount += payment.amount || 0;
    }
  });
  
  return summary;
};

/**
 * Get today's collection
 * @param {string} gymId
 * @returns {Promise<number>}
 */
export const getTodayCollection = async (gymId) => {
  const today = new Date().toISOString().split('T')[0];
  const payments = await queryDocuments(
    `gyms/${gymId}/payments`,
    [['paymentDate', '==', today]]
  );
  
  return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
};

/**
 * Get next receipt number for gym
 * @param {string} gymId
 * @returns {Promise<string>}
 */
export const getNextReceiptNumberForGym = async (gymId) => {
  const payments = await queryDocuments(
    `gyms/${gymId}/payments`,
    [],
    { orderByField: 'receiptNumber', orderDirection: 'desc', limitCount: 1 }
  );
  
  let lastSequence = 0;
  if (payments.length > 0 && payments[0].receiptNumber) {
    const parts = payments[0].receiptNumber.split('-');
    if (parts.length >= 2) {
      lastSequence = parseInt(parts[parts.length - 1], 10);
    }
  }
  
  return getNextReceiptNumber(lastSequence);
};
