const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let cachedConfig = null;

function getConfigPath() {
  const userDataPath = app ? app.getPath('userData') : path.join(__dirname, '..', '..', 'config');
  return path.join(userDataPath, 'settings.json');
}

function getDefaultConfigPath() {
  return path.join(__dirname, '..', '..', 'config', 'default.json');
}

function loadConfig() {
  if (cachedConfig) return cachedConfig;

  const configPath = getConfigPath();

  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf8');
    cachedConfig = JSON.parse(raw);
  } else {
    const defaultPath = getDefaultConfigPath();
    const raw = fs.readFileSync(defaultPath, 'utf8');
    cachedConfig = JSON.parse(raw);
  }

  return cachedConfig;
}

function saveConfig(config) {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  cachedConfig = config;
}

module.exports = { loadConfig, saveConfig };
