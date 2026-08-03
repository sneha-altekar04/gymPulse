const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
const db = require('../storage/database');

/**
 * FirebaseCache - Downloads members and memberships from Firestore,
 * stores them locally for offline membership validation.
 */
class FirebaseCache {
  constructor(firebaseConfig, gymId, logger) {
    this.firebaseConfig = firebaseConfig;
    this.gymId = gymId;
    this.logger = logger;
    this.firestore = null;
    this.app = null;
  }

  async initialize() {
    if (!this.firebaseConfig.apiKey) {
      this.logger.warn('FirebaseCache: No Firebase config — running offline-only');
      return;
    }

    this.app = initializeApp(this.firebaseConfig, 'sync-agent');
    this.firestore = getFirestore(this.app);
    this.logger.info('FirebaseCache: Firebase initialized');
  }

  getFirestore() {
    return this.firestore;
  }

  async refreshCache() {
    if (!this.firestore) return;

    try {
      await this._downloadMembers();
      await this._downloadMemberships();
      db.updateSyncState('lastCacheRefresh', new Date().toISOString());
      this.logger.info('FirebaseCache: Cache refreshed');
    } catch (err) {
      this.logger.error('FirebaseCache: Refresh failed', { error: err.message });
    }
  }

  getMemberByDeviceUserId(deviceUserId) {
    return db.getMemberByDeviceUserId(deviceUserId);
  }

  getActiveMembership(memberId) {
    return db.getActiveMembership(memberId);
  }

  async _downloadMembers() {
    const ref = collection(this.firestore, `gyms/${this.gymId}/members`);
    const snapshot = await getDocs(ref);
    const members = [];

    snapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() });
    });

    db.upsertMembers(members);
    this.logger.info('FirebaseCache: Members cached', { count: members.length });
  }

  async _downloadMemberships() {
    const ref = collection(this.firestore, `gyms/${this.gymId}/memberships`);
    const q = query(ref, where('status', '==', 'ACTIVE'));
    const snapshot = await getDocs(q);
    const memberships = [];

    snapshot.forEach((doc) => {
      memberships.push({ id: doc.id, ...doc.data() });
    });

    db.upsertMemberships(memberships);
    this.logger.info('FirebaseCache: Memberships cached', { count: memberships.length });
  }
}

module.exports = { FirebaseCache };
