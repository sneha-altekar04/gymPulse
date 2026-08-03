const { BiometricDevice } = require('./BiometricDevice');

/**
 * MockDeviceAdapter - Simulates a biometric device for development.
 * Replace with real SDK adapter (e.g., IdentixAdapter) when hardware is available.
 */
class MockDeviceAdapter extends BiometricDevice {
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.connected = false;
    this.listener = null;
    this.pollTimer = null;
  }

  async connect() {
    this.logger.info('MockDevice: Connecting...', { ip: this.config.ip, port: this.config.port });
    await this._delay(500);
    this.connected = true;
    this.logger.info('MockDevice: Connected successfully');
    return true;
  }

  async disconnect() {
    this.connected = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.logger.info('MockDevice: Disconnected');
  }

  async getUsers() {
    this._assertConnected();
    return [
      { userId: 'FP-101', name: 'User 101' },
      { userId: 'FP-102', name: 'User 102' },
      { userId: 'FP-103', name: 'User 103' },
      { userId: 'FP-104', name: 'User 104' },
      { userId: 'FP-105', name: 'User 105' }
    ];
  }

  async downloadAttendance(since) {
    this._assertConnected();
    const now = new Date();
    return [
      { userId: 'FP-101', timestamp: now.toISOString(), type: 'CHECK_IN' },
      { userId: 'FP-103', timestamp: now.toISOString(), type: 'CHECK_IN' }
    ];
  }

  async listenForAttendance(callback) {
    this._assertConnected();
    this.listener = callback;
    // Simulate periodic attendance events
    this.pollTimer = setInterval(() => {
      if (!this.connected || !this.listener) return;
      const users = ['FP-101', 'FP-102', 'FP-103', 'FP-104', 'FP-105'];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const event = {
        userId: randomUser,
        timestamp: new Date().toISOString(),
        type: 'CHECK_IN'
      };
      this.logger.info('MockDevice: Attendance event', { userId: event.userId });
      this.listener(event);
    }, 60000); // Emit mock event every 60s
  }

  async verifyConnection() {
    return this.connected;
  }

  async getDeviceInfo() {
    this._assertConnected();
    return {
      model: 'Mock Biometric Device',
      serialNumber: 'MOCK-001',
      firmware: 'v1.0.0-mock',
      userCapacity: 3000,
      registeredUsers: 5,
      ip: this.config.ip,
      port: this.config.port
    };
  }

  _assertConnected() {
    if (!this.connected) {
      throw new Error('Device not connected');
    }
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { MockDeviceAdapter };
