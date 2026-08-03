const path = require('path');
const { app } = require('electron');
const winston = require('winston');

let logger = null;

function initializeLogger(config = {}) {
  const logDir = app ? path.join(app.getPath('userData'), 'logs') : path.join(__dirname, '..', '..', 'logs');

  const fs = require('fs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  logger = winston.createLogger({
    level: config.level || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: parseSizeToBytes(config.maxFileSize || '10m'),
        maxFiles: config.maxFiles || 5
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: parseSizeToBytes(config.maxFileSize || '10m'),
        maxFiles: config.maxFiles || 5
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });

  return logger;
}

function parseSizeToBytes(size) {
  const units = { k: 1024, m: 1024 * 1024, g: 1024 * 1024 * 1024 };
  const match = String(size).match(/^(\d+)([kmg])?$/i);
  if (!match) return 10 * 1024 * 1024;
  const num = parseInt(match[1], 10);
  const unit = (match[2] || 'm').toLowerCase();
  return num * (units[unit] || 1);
}

function getLogger() {
  return logger;
}

module.exports = { initializeLogger, getLogger };
