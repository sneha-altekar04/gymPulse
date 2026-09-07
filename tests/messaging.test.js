import assert from 'node:assert/strict';
import test from 'node:test';

import { MESSAGE_STATUS, RECIPIENT_TYPE } from '../src/constants/domain.js';
import {
  createMessageIdempotencyKey,
  getExpiryNotificationType,
  normalizeIndianPhone,
  renderMessageTemplate
} from '../src/utils/messageUtils.js';
import { MessageProvider } from '../server/messaging/MessageProvider.js';
import { MockMessageProvider } from '../server/messaging/MockMessageProvider.js';
import { processInBatches } from '../server/messaging/messageEngine.js';
import { filterRecipients } from '../server/messaging/recipientResolver.js';

const now = new Date('2026-08-31T04:00:00Z');

test('classifies configured expiry reminder days and expiry day', () => {
  assert.equal(getExpiryNotificationType('2026-09-07', [7, 3, 1], false, now), 'EXPIRY_7_DAYS');
  assert.equal(getExpiryNotificationType('2026-09-03', [7, 3, 1], false, now), 'EXPIRY_3_DAYS');
  assert.equal(getExpiryNotificationType('2026-09-01', [7, 3, 1], false, now), 'EXPIRY_1_DAY');
  assert.equal(getExpiryNotificationType('2026-08-31', [7, 3, 1], true, now), 'MEMBERSHIP_EXPIRED');
  assert.equal(getExpiryNotificationType('2026-09-05', [7, 3, 1], false, now), null);
});

test('renders supported variables without hard-coded member values', () => {
  assert.equal(renderMessageTemplate('Hi {{memberName}} from {{gymName}}', { memberName: 'Rahul Patil', gymName: 'GymPulse' }), 'Hi Rahul Patil from GymPulse');
});

test('validates Indian phone numbers and rejects missing or invalid values', () => {
  assert.equal(normalizeIndianPhone('98765 43210'), '+919876543210');
  assert.equal(normalizeIndianPhone('+91-9876543210'), '+919876543210');
  assert.equal(normalizeIndianPhone(''), null);
  assert.equal(normalizeIndianPhone('12345'), null);
});

test('idempotency keys are stable and isolated between gyms', () => {
  const first = createMessageIdempotencyKey('gym-a', 'member-1', 'EXPIRY_7_DAYS', '2026-09-07');
  assert.equal(first, createMessageIdempotencyKey('gym-a', 'member-1', 'EXPIRY_7_DAYS', '2026-09-07'));
  assert.notEqual(first, createMessageIdempotencyKey('gym-b', 'member-1', 'EXPIRY_7_DAYS', '2026-09-07'));
});

test('filters bulk recipient groups and handles no recipients', () => {
  const recipients = [
    { member: { id: 'active', status: 'ACTIVE' }, membership: { finalAmount: 1000, amountPaid: 1000 }, daysRemaining: 20 },
    { member: { id: 'expiring', status: 'ACTIVE' }, membership: { finalAmount: 1000, amountPaid: 500 }, daysRemaining: 3 },
    { member: { id: 'expired', status: 'ACTIVE' }, membership: { finalAmount: 1000, amountPaid: 1000 }, daysRemaining: -2 }
  ];
  assert.deepEqual(filterRecipients(recipients, RECIPIENT_TYPE.EXPIRING_SOON).map((item) => item.member.id), ['expiring']);
  assert.deepEqual(filterRecipients(recipients, RECIPIENT_TYPE.PENDING_PAYMENT).map((item) => item.member.id), ['expiring']);
  assert.deepEqual(filterRecipients(recipients, RECIPIENT_TYPE.SELECTED_MEMBERS, ['missing']), []);
});

test('mock provider simulates sent, delivered, and failed outcomes', async () => {
  const provider = new MockMessageProvider();
  assert.equal((await provider.sendMessage({ simulateStatus: MESSAGE_STATUS.SENT })).status, MESSAGE_STATUS.SENT);
  assert.equal((await provider.sendMessage({ simulateStatus: MESSAGE_STATUS.DELIVERED })).status, MESSAGE_STATUS.DELIVERED);
  await assert.rejects(() => provider.sendMessage({ simulateStatus: MESSAGE_STATUS.FAILED }), /simulated/);
});

test('bulk provider and campaign batches isolate failed messages', async () => {
  class TestProvider extends MessageProvider {
    async sendMessage(message) {
      if (message.fail) throw new Error('Expected failure');
      return { status: MESSAGE_STATUS.SENT };
    }
  }
  const bulk = await new TestProvider().sendBulkMessages([{ fail: false }, { fail: true }, { fail: false }], { batchSize: 2 });
  assert.deepEqual(bulk.map((item) => item.status), [MESSAGE_STATUS.SENT, MESSAGE_STATUS.FAILED, MESSAGE_STATUS.SENT]);
  const processed = await processInBatches([], async () => ({ success: true }), 10);
  assert.deepEqual(processed, []);
});