import { randomUUID } from 'node:crypto';
import { MESSAGE_STATUS } from '../../src/constants/domain.js';
import { MessageProvider } from './MessageProvider.js';

export class MockMessageProvider extends MessageProvider {
  async sendMessage(message) {
    const requestedStatus = message.simulateStatus;
    const status = Object.values(MESSAGE_STATUS).includes(requestedStatus)
      ? requestedStatus
      : MESSAGE_STATUS.SENT;

    if (status === MESSAGE_STATUS.FAILED) {
      const error = new Error('Mock provider simulated a delivery failure.');
      error.code = 'MOCK_DELIVERY_FAILED';
      throw error;
    }

    return {
      providerMessageId: `mock_${randomUUID()}`,
      status,
      sentAt: new Date()
    };
  }

  async getMessageStatus(providerMessageId) {
    return {
      providerMessageId,
      status: MESSAGE_STATUS.DELIVERED,
      deliveredAt: new Date()
    };
  }
}