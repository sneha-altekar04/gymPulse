const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getStatus: () => ipcRenderer.invoke('get-status'),
  getStats: () => ipcRenderer.invoke('get-stats'),
  getRecentLogs: () => ipcRenderer.invoke('get-recent-logs'),
  connectDevice: () => ipcRenderer.invoke('connect-device'),
  disconnectDevice: () => ipcRenderer.invoke('disconnect-device'),
  syncNow: () => ipcRenderer.invoke('sync-now'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  exportLogs: () => ipcRenderer.invoke('export-logs')
});
