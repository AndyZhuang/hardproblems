// 轻量级 logger
import { config } from './config.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[config.logLevel] ?? LEVELS.info;

function fmt(level, msg, meta) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${msg}`;
  if (meta) {
    try { return `${base} ${JSON.stringify(meta)}`; } catch { return base; }
  }
  return base;
}

function log(level, msg, meta) {
  if (LEVELS[level] > currentLevel) return;
  const line = fmt(level, msg, meta);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
  child: (prefix) => ({
    error: (msg, meta) => log('error', `[${prefix}] ${msg}`, meta),
    warn: (msg, meta) => log('warn', `[${prefix}] ${msg}`, meta),
    info: (msg, meta) => log('info', `[${prefix}] ${msg}`, meta),
    debug: (msg, meta) => log('debug', `[${prefix}] ${msg}`, meta)
  })
};
