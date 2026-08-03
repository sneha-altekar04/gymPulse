/**
 * BiometricDevice - Abstract interface for biometric attendance devices.
 * All device adapters must implement these methods.
 */
class BiometricDevice {
  async connect() { throw new Error('Not implemented'); }
  async disconnect() { throw new Error('Not implemented'); }
  async getUsers() { throw new Error('Not implemented'); }
  async downloadAttendance(since) { throw new Error('Not implemented'); }
  async listenForAttendance(callback) { throw new Error('Not implemented'); }
  async verifyConnection() { throw new Error('Not implemented'); }
  async getDeviceInfo() { throw new Error('Not implemented'); }
}

module.exports = { BiometricDevice };
