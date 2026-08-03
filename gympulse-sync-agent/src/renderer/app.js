const POLL_INTERVAL = 3000;

let currentConfig = null;

async function init() {
  await loadSettings();
  startPolling();
  bindEvents();
}

async function loadSettings() {
  currentConfig = await window.api.getConfig();
}

function startPolling() {
  refresh();
  setInterval(refresh, POLL_INTERVAL);
}

async function refresh() {
  try {
    const status = await window.api.getStatus();
    const stats = await window.api.getStats();
    updateUI(status, stats);
  } catch (err) {
    console.error('Poll error:', err);
  }
}

function updateUI(status, stats) {
  // Internet indicator
  const internetEl = document.getElementById('internet-indicator');
  if (status.internet) {
    internetEl.textContent = '⬤ Online';
    internetEl.className = 'indicator indicator--online';
  } else {
    internetEl.textContent = '⬤ Offline';
    internetEl.className = 'indicator indicator--offline';
  }

  // Device indicator
  const deviceEl = document.getElementById('device-indicator');
  if (status.device.connected) {
    deviceEl.textContent = '⬤ Connected';
    deviceEl.className = 'indicator indicator--connected';
  } else {
    deviceEl.textContent = '⬤ No Device';
    deviceEl.className = 'indicator indicator--disconnected';
  }

  // Cards
  const connEl = document.getElementById('connection-status');
  connEl.textContent = status.device.connected ? 'Connected' : 'Disconnected';
  connEl.className = status.device.connected
    ? 'card__value card__value--success'
    : 'card__value card__value--warning';

  document.getElementById('pending-queue').textContent = stats.pendingQueue || 0;
  document.getElementById('today-attendance').textContent = stats.todayAttendance || 0;

  const rejEl = document.getElementById('rejected-today');
  rejEl.textContent = stats.rejectedToday || 0;
  rejEl.className = stats.rejectedToday > 0
    ? 'card__value card__value--danger'
    : 'card__value';

  document.getElementById('last-sync').textContent = stats.lastSync
    ? new Date(stats.lastSync).toLocaleTimeString()
    : '--';
}

async function refreshLogs() {
  const logs = await window.api.getRecentLogs();
  const container = document.getElementById('logs-container');

  if (!logs || logs.length === 0) {
    container.innerHTML = '<p class="logs-list__empty">No activity yet.</p>';
    return;
  }

  container.innerHTML = logs.map(log => {
    const time = new Date(log.timestamp).toLocaleTimeString();
    const levelClass = `log-entry__level--${log.level}`;
    return `<div class="log-entry">
      <span class="log-entry__time">${time}</span>
      <span class="log-entry__level ${levelClass}">${log.level.toUpperCase()}</span>
      <span class="log-entry__msg">${escapeHtml(log.message)}</span>
    </div>`;
  }).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function bindEvents() {
  document.getElementById('btn-connect').addEventListener('click', async () => {
    await window.api.connectDevice();
    await refresh();
  });

  document.getElementById('btn-sync').addEventListener('click', async () => {
    await window.api.syncNow();
    await refresh();
  });

  document.getElementById('btn-export').addEventListener('click', async () => {
    await window.api.exportLogs();
  });

  // Settings
  document.getElementById('btn-settings').addEventListener('click', openSettings);
  document.getElementById('btn-cancel-settings').addEventListener('click', closeSettings);
  document.getElementById('settings-form').addEventListener('submit', saveSettings);

  // Refresh logs periodically
  setInterval(refreshLogs, 5000);
  refreshLogs();
}

function openSettings() {
  const cfg = currentConfig;
  document.getElementById('cfg-device-ip').value = cfg.device.ip;
  document.getElementById('cfg-device-port').value = cfg.device.port;
  document.getElementById('cfg-poll-interval').value = cfg.sync.pollingIntervalMs;
  document.getElementById('cfg-auto-sync').checked = cfg.app.autoSync;
  document.getElementById('cfg-gym-id').value = cfg.app.gymId;
  document.getElementById('cfg-auto-start').checked = cfg.app.autoStart;
  document.getElementById('cfg-minimize-tray').checked = cfg.app.minimizeToTray;
  document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
}

async function saveSettings(e) {
  e.preventDefault();
  const updated = {
    ...currentConfig,
    device: {
      ...currentConfig.device,
      ip: document.getElementById('cfg-device-ip').value,
      port: parseInt(document.getElementById('cfg-device-port').value, 10)
    },
    sync: {
      ...currentConfig.sync,
      pollingIntervalMs: parseInt(document.getElementById('cfg-poll-interval').value, 10)
    },
    app: {
      ...currentConfig.app,
      autoSync: document.getElementById('cfg-auto-sync').checked,
      gymId: document.getElementById('cfg-gym-id').value,
      autoStart: document.getElementById('cfg-auto-start').checked,
      minimizeToTray: document.getElementById('cfg-minimize-tray').checked
    }
  };

  await window.api.saveConfig(updated);
  currentConfig = updated;
  closeSettings();
}

document.addEventListener('DOMContentLoaded', init);
