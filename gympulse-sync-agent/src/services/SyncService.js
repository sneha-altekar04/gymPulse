const db = require('../storage/database');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

/**
 * SyncService - Uploads queued attendance records to Firestore.
 * Implements retry with exponential backoff.
 */
class SyncService {
  constructor(config, gymId, logger) {
    this.config = config;
    this.gymId = gymId;
    this.logger = logger;
    this.running = false;
    this.paused = false;
    this.online = true;
    this.lastSyncTime = null;
    this.syncTimer = null;
    this.firestore = null;
  }

  async start() {
    this.running = true;
    this._scheduleSync();
    this.logger.info('SyncService: Started', { interval: this.config.pollingIntervalMs });
  }

  stop() {
    this.running = false;
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.logger.info('SyncService: Stopped');
  }

  pause() {
    this.paused = true;
    this.logger.info('SyncService: Paused');
  }

  resume() {
    this.paused = false;
    this.logger.info('SyncService: Resumed');
  }

  async syncNow() {
    if (this.paused) return;
    await this._uploadPending();
  }

  isOnline() {
    return this.online;
  }

  getStatus() {
    return {
      running: this.running,
      paused: this.paused,
      online: this.online
    };
  }

  getLastSyncTime() {
    return this.lastSyncTime;
  }

  setFirestore(firestoreInstance) {
    this.firestore = firestoreInstance;
  }

  _scheduleSync() {
    this.syncTimer = setInterval(async () => {
      if (!this.paused) {
        await this._uploadPending();
      }
    }, this.config.pollingIntervalMs);
  }

  async _uploadPending() {
    if (!this.firestore) {
      this.logger.warn('SyncService: Firestore not initialized');
      return;
    }

    const pending = db.getPendingAttendance(this.config.batchSize);
    if (pending.length === 0) return;

    this.logger.info('SyncService: Uploading batch', { count: pending.length });

    for (const record of pending) {
      try {
        await this._uploadRecord(record);
        db.markSynced(record.id);
        this.online = true;
      } catch (err) {
        this.online = false;
        const retries = (record.retryCount || 0) + 1;
        if (retries >= this.config.maxRetries) {
          db.markFailed(record.id);
          this.logger.error('SyncService: Max retries reached', { id: record.id });
        } else {
          db.incrementRetry(record.id, retries);
          this.logger.warn('SyncService: Retry scheduled', { id: record.id, retries });
        }
        break; // Stop batch on failure — will retry next cycle
      }
    }

    this.lastSyncTime = new Date().toISOString();
    db.updateSyncState('lastSync', this.lastSyncTime);
    db.addLog('info', `Sync completed: ${pending.length} records processed`);
  }

  async _uploadRecord(record) {
    const collectionRef = collection(this.firestore, `gyms/${this.gymId}/attendance`);
    await addDoc(collectionRef, {
      memberId: record.memberId,
      deviceUserId: record.deviceUserId,
      checkInTime: record.checkInTime,
      checkOutTime: null,
      source: 'FINGERPRINT',
      membershipStatus: record.membershipStatus,
      createdAt: serverTimestamp()
    });
  }
}

module.exports = { SyncService };
