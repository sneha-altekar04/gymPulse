export class MessageProvider {
  async sendMessage() {
    throw new Error('sendMessage must be implemented by the provider.');
  }

  async sendBulkMessages(messages, options = {}) {
    const batchSize = Math.max(1, Number(options.batchSize) || 10);
    const results = [];
    for (let index = 0; index < messages.length; index += batchSize) {
      const batch = messages.slice(index, index + batchSize);
      results.push(...await Promise.all(batch.map(async (message) => {
        try {
          return await this.sendMessage(message);
        } catch (error) {
          return { status: 'FAILED', failureReason: error.message };
        }
      })));
    }
    return results;
  }

  async getMessageStatus() {
    throw new Error('getMessageStatus must be implemented by the provider.');
  }
}