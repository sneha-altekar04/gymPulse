const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const { initializeLogger } = require('../utils/logger');
const { loadConfig, saveConfig } = require('../utils/config');
const { initializeDatabase } = require('../storage/database');
const { DeviceManager } = require('../device/DeviceManager');
const { SyncService } = require('../services/SyncService');
const { AttendanceProcessor } = require('../services/AttendanceProcessor');
const { FirebaseCache } = require('../services/FirebaseCache');

let mainWindow = null;
let tray = null;
let deviceManager = null;
let syncService = null;
let attendanceProcessor = null;
let firebaseCache = null;
let logger = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 780,
    minHeight: 550,
    title: 'GymPulse Sync Agent',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    const config = loadConfig();
    if (config.app.minimizeToTray) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'tray-icon.png');
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Dashboard', click: () => mainWindow && mainWindow.show() },
    { type: 'separator' },
    { label: 'Sync Now', click: () => syncService && syncService.syncNow() },
    { label: 'Pause Sync', click: () => syncService && syncService.pause() },
    { label: 'Resume Sync', click: () => syncService && syncService.resume() },
    { type: 'separator' },
    { label: 'Exit', click: () => { app.isQuitting = true; app.quit(); } }
  ]);

  tray.setToolTip('GymPulse Sync Agent');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow && mainWindow.show());
}

async function initializeServices() {
  const config = loadConfig();
  logger = initializeLogger(config.logging);
  logger.info('GymPulse Sync Agent starting...');

  try {
    initializeDatabase();
    logger.info('SQLite database initialized');

    firebaseCache = new FirebaseCache(config.firebase, config.app.gymId, logger);
    await firebaseCache.initialize();
    logger.info('Firebase cache initialized');

    attendanceProcessor = new AttendanceProcessor(firebaseCache, logger);

    syncService = new SyncService(config.sync, config.app.gymId, logger);
    await syncService.start();
    logger.info('Sync service started');

    deviceManager = new DeviceManager(config.device, attendanceProcessor, logger);
    await deviceManager.initialize();
    logger.info('Device manager initialized');
  } catch (err) {
    logger.error('Service initialization failed', { error: err.message });
  }
}

function registerIpcHandlers() {
  ipcMain.handle('get-status', () => ({
    device: deviceManager ? deviceManager.getStatus() : { connected: false },
    sync: syncService ? syncService.getStatus() : { running: false },
    internet: syncService ? syncService.isOnline() : false
  }));

  ipcMain.handle('get-stats', () => {
    const db = require('../storage/database');
    return {
      pendingQueue: db.getPendingCount(),
      todayAttendance: db.getTodayAttendanceCount(),
      rejectedToday: db.getTodayRejectedCount(),
      lastSync: syncService ? syncService.getLastSyncTime() : null
    };
  });

  ipcMain.handle('get-recent-logs', () => {
    const db = require('../storage/database');
    return db.getRecentLogs(50);
  });

  ipcMain.handle('connect-device', async () => {
    if (deviceManager) {
      await deviceManager.connect();
      return deviceManager.getStatus();
    }
    return { connected: false, error: 'Device manager not initialized' };
  });

  ipcMain.handle('disconnect-device', async () => {
    if (deviceManager) {
      await deviceManager.disconnect();
    }
  });

  ipcMain.handle('sync-now', async () => {
    if (syncService) {
      await syncService.syncNow();
      return { success: true };
    }
    return { success: false };
  });

  ipcMain.handle('get-config', () => loadConfig());

  ipcMain.handle('save-config', (event, newConfig) => {
    saveConfig(newConfig);
    return { success: true };
  });

  ipcMain.handle('export-logs', () => {
    const db = require('../storage/database');
    return db.exportLogs();
  });
}

app.whenReady().then(async () => {
  createTray();
  await createWindow();
  registerIpcHandlers();
  await initializeServices();
});

app.on('window-all-closed', () => {
  // Keep running in tray on Windows
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (syncService) syncService.stop();
  if (deviceManager) deviceManager.disconnect();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
