const { MockDeviceAdapter } = require('./MockDeviceAdapter');

/**
 * DeviceManager - Manages biometric device lifecycle.
 * Handles connection, reconnection, and attendance event forwarding.
 */
class DeviceManager {
  constructor(config, attendanceProcessor, logger) {
    this.config = config;
    this.processor = attendanceProcessor;
    this.logger = logger;
    this.adapter = null;
    this.connected = false;
    this.reconnectTimer = null;
    this.reconnectIntervalMs = 15000;
  }

  async initialize() {
    this.adapter = new MockDeviceAdapter(this.config, this.logger);
    this.logger.info('DeviceManager: Initialized with MockDeviceAdapter');
  }

  async connect() {
    try {
      await this.adapter.connect();
      this.connected = true;
      await this.adapter.listenForAttendance((event) => this._onAttendanceEvent(event));
      this.logger.info('DeviceManager: Device connected and listening');
      this._clearReconnect();
    } catch (err) {
      this.connected = false;
      this.logger.error('DeviceManager: Connection failed', { error: err.message });
      this._scheduleReconnect();
    }
  }

  async disconnect() {
    this._clearReconnect();
    if (this.adapter) {
      await this.adapter.disconnect();
    }
    this.connected = false;
    this.logger.info('DeviceManager: Disconnected');
  }

  getStatus() {
    return {
      connected: this.connected,
      adapter: 'MockDeviceAdapter'
    };
  }

  _onAttendanceEvent(event) {
    if (this.processor) {
      this.processor.process(event);
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setInterval(async () => {
      this.logger.info('DeviceManager: Attempting reconnection...');
      await this.connect();
    }, this.reconnectIntervalMs);
  }

  _clearReconnect() {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

module.exports = { DeviceManager };
