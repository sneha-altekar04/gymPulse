import assert from 'node:assert/strict';
import test from 'node:test';

import {
  allocatePayment,
  calculatePurchaseTotals,
  calculateSubscriptionEndDate
} from '../src/utils/purchaseCalculations.js';

test('preserves the existing membership-only calculation', () => {
  assert.deepEqual(calculatePurchaseTotals({ membershipAmount: 4000, discount: 500, amountPaid: 2000 }), {
    membershipAmount: 4000,
    personalTrainingAmount: 0,
    subtotal: 4000,
    discount: 500,
    totalAmount: 3500,
    amountPaid: 2000,
    pendingAmount: 1500
  });
});

test('calculates combined membership and PT charges', () => {
  const result = calculatePurchaseTotals({
    membershipAmount: 4000,
    personalTrainingAmount: 5000,
    discount: 500,
    amountPaid: 5000
  });
  assert.equal(result.subtotal, 9000);
  assert.equal(result.totalAmount, 8500);
  assert.equal(result.pendingAmount, 3500);
});

test('calculates inclusive PT end dates independently of membership dates', () => {
  assert.equal(calculateSubscriptionEndDate('2026-08-01', 3, 'MONTH'), '2026-10-31');
  assert.equal(calculateSubscriptionEndDate('2026-08-01', 1, 'MONTH'), '2026-08-31');
});

test('allocates partial payments while retaining charge categories', () => {
  assert.deepEqual(allocatePayment(5000, 2000, 3000), {
    membershipAmount: 2000,
    personalTrainingAmount: 3000
  });
});