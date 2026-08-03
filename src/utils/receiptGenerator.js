/**
 * Receipt Number Generator
 * Generates consistent receipt numbers in format: GYM-YYYY-000001
 */

/**
 * Generate receipt number
 * @param {string} gymId
 * @param {number} sequenceNumber - Sequential number for this gym and year
 * @returns {string} Receipt number in format GYM-YYYY-000001
 */
export const generateReceiptNumber = (gymId, sequenceNumber = 1) => {
  const year = new Date().getFullYear();
  const paddedNumber = String(sequenceNumber).padStart(6, '0');
  return `${year}-${paddedNumber}`;
};

/**
 * Parse receipt number to extract sequence
 * @param {string} receiptNumber
 * @returns {number} Sequence number
 */
export const parseReceiptNumber = (receiptNumber) => {
  if (!receiptNumber) return 0;
  const parts = receiptNumber.split('-');
  if (parts.length === 2) {
    return parseInt(parts[1], 10);
  }
  return 0;
};

/**
 * Get next receipt number for a gym
 * Call this after confirming the previous highest number from Firestore
 * @param {number} lastSequenceNumber
 * @returns {string}
 */
export const getNextReceiptNumber = (lastSequenceNumber = 0) => {
  return generateReceiptNumber(null, lastSequenceNumber + 1);
};
