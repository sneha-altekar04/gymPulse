const path = require('path');
const { app } = require('electron');
let Database;

try {
  Database = require('better-sqlite3');
} catch (err) {
  // Fallback for when running outside Electron context
  Database = null;
}

let db = null;

function getDbPath() {
  const userDataPath = app ? app.getPath('userData') : path.join(__dirname, '..', '..', 'data');
  return path.join(userDataPath, 'gympulse-sync.db');
}

function initializeDatabase() {
  const dbPath = getDbPath();
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  createTables();
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberId TEXT NOT NULL,
      deviceUserId TEXT NOT NULL,
      checkInTime TEXT NOT NULL,
      source TEXT DEFAULT 'FINGERPRINT',
      membershipStatus TEXT,
      syncStatus TEXT DEFAULT 'PENDING',
      retryCount INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      syncedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS members_cache (
      id TEXT PRIMARY KEY,
      fullName TEXT,
      memberCode TEXT,
      mobile TEXT,
      email TEXT,
      deviceUserId TEXT,
      trainerId TEXT,
      status TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS memberships_cache (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      planId TEXT,
      startDate TEXT,
      endDate TEXT,
      status TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS rejections_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deviceUserId TEXT,
      memberName TEXT,
      reason TEXT,
      timestamp TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS device_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_queue_status ON attendance_queue(syncStatus);
    CREATE INDEX IF NOT EXISTS idx_queue_created ON attendance_queue(createdAt);
    CREATE INDEX IF NOT EXISTS idx_members_device ON members_cache(deviceUserId);
    CREATE INDEX IF NOT EXISTS idx_memberships_member ON memberships_cache(memberId);
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON device_logs(timestamp);
  `);
}

// --- Attendance Queue ---

function queueAttendance(record) {
  const stmt = db.prepare(`
    INSERT INTO attendance_queue (memberId, deviceUserId, checkInTime, source, membershipStatus, syncStatus, createdAt)
    VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
  `);
  stmt.run(record.memberId, record.deviceUserId, record.checkInTime, record.source, record.membershipStatus, record.createdAt);
}

function getPendingAttendance(limit = 50) {
  return db.prepare('SELECT * FROM attendance_queue WHERE syncStatus = ? ORDER BY createdAt ASC LIMIT ?').all('PENDING', limit);
}

function getPendingCount() {
  const row = db.prepare('SELECT COUNT(*) as count FROM attendance_queue WHERE syncStatus = ?').get('PENDING');
  return row.count;
}

function markSynced(id) {
  db.prepare('UPDATE attendance_queue SET syncStatus = ?, syncedAt = ? WHERE id = ?').run('SYNCED', new Date().toISOString(), id);
}

function markFailed(id) {
  db.prepare('UPDATE attendance_queue SET syncStatus = ? WHERE id = ?').run('FAILED', id);
}

function incrementRetry(id, retryCount) {
  db.prepare('UPDATE attendance_queue SET retryCount = ? WHERE id = ?').run(retryCount, id);
}

function hasRecentAttendance(deviceUserId, since) {
  const row = db.prepare('SELECT COUNT(*) as count FROM attendance_queue WHERE deviceUserId = ? AND checkInTime > ?').get(deviceUserId, since);
  return row.count > 0;
}

function getTodayAttendanceCount() {
  const today = new Date().toISOString().slice(0, 10);
  const row = db.prepare("SELECT COUNT(*) as count FROM attendance_queue WHERE createdAt LIKE ?").get(`${today}%`);
  return row.count;
}

// --- Members Cache ---

function upsertMembers(members) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO members_cache (id, fullName, memberCode, mobile, email, deviceUserId, trainerId, status, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((items) => {
    for (const m of items) {
      stmt.run(m.id, m.fullName || '', m.memberCode || '', m.mobile || '', m.email || '', m.deviceUserId || '', m.trainerId || '', m.status || '', new Date().toISOString());
    }
  });
  tx(members);
}

function getMemberByDeviceUserId(deviceUserId) {
  return db.prepare('SELECT * FROM members_cache WHERE deviceUserId = ?').get(deviceUserId) || null;
}

// --- Memberships Cache ---

function upsertMemberships(memberships) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO memberships_cache (id, memberId, planId, startDate, endDate, status, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((items) => {
    for (const m of items) {
      const endDate = m.endDate ? (m.endDate.toDate ? m.endDate.toDate().toISOString() : m.endDate) : '';
      const startDate = m.startDate ? (m.startDate.toDate ? m.startDate.toDate().toISOString() : m.startDate) : '';
      stmt.run(m.id, m.memberId, m.planId || '', startDate, endDate, m.status || '', new Date().toISOString());
    }
  });
  tx(memberships);
}

function getActiveMembership(memberId) {
  return db.prepare("SELECT * FROM memberships_cache WHERE memberId = ? AND status = 'ACTIVE' ORDER BY endDate DESC LIMIT 1").get(memberId) || null;
}

// --- Rejections ---

function logRejection(entry) {
  db.prepare('INSERT INTO rejections_log (deviceUserId, memberName, reason, timestamp, createdAt) VALUES (?, ?, ?, ?, ?)')
    .run(entry.deviceUserId, entry.memberName, entry.reason, entry.timestamp, entry.createdAt);
}

function getTodayRejectedCount() {
  const today = new Date().toISOString().slice(0, 10);
  const row = db.prepare("SELECT COUNT(*) as count FROM rejections_log WHERE createdAt LIKE ?").get(`${today}%`);
  return row.count;
}

// --- Logs ---

function addLog(level, message) {
  db.prepare('INSERT INTO device_logs (level, message, timestamp) VALUES (?, ?, ?)').run(level, message, new Date().toISOString());
}

function getRecentLogs(limit = 50) {
  return db.prepare('SELECT * FROM device_logs ORDER BY timestamp DESC LIMIT ?').all(limit);
}

function exportLogs() {
  return db.prepare('SELECT * FROM device_logs ORDER BY timestamp DESC LIMIT 1000').all();
}

// --- Sync State ---

function updateSyncState(key, value) {
  db.prepare('INSERT OR REPLACE INTO sync_state (key, value) VALUES (?, ?)').run(key, value);
}

function getSyncState(key) {
  const row = db.prepare('SELECT value FROM sync_state WHERE key = ?').get(key);
  return row ? row.value : null;
}

module.exports = {
  initializeDatabase,
  queueAttendance,
  getPendingAttendance,
  getPendingCount,
  markSynced,
  markFailed,
  incrementRetry,
  hasRecentAttendance,
  getTodayAttendanceCount,
  upsertMembers,
  getMemberByDeviceUserId,
  upsertMemberships,
  getActiveMembership,
  logRejection,
  getTodayRejectedCount,
  addLog,
  getRecentLogs,
  exportLogs,
  updateSyncState,
  getSyncState
};
