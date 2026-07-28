// 加载 .env（轻量版，不依赖 dotenv）
import { fileURLToPath } from 'url';
import { dirname, join, resolve, isAbsolute } from 'path';
import { existsSync, readFileSync } from 'fs';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// ROOT = server/ 目录
const ROOT = join(__dirname, '..');

function loadEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf-8');
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
    if (!m) continue;
    const [, k, v] = m;
    if (process.env[k] === undefined) {
      process.env[k] = v.replace(/^["']|["']$/g, '').trim();
    }
  }
}
loadEnv();

function int(name, def) {
  const v = process.env[name];
  if (v === undefined || v === '') return def;
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) throw new Error(`env ${name} must be integer, got: ${v}`);
  return n;
}
function str(name, def) {
  return (process.env[name] ?? def).toString();
}
function bool(name, def) {
  const v = process.env[name];
  if (v === undefined || v === '') return def;
  return /^(1|true|yes|on)$/i.test(v);
}
function list(name, def) {
  return str(name, def).split(',').map(s => s.trim()).filter(Boolean);
}

export const config = {
  env: str('NODE_ENV', 'development'),
  port: int('PORT', 4000),
  host: str('HOST', '0.0.0.0'),

  jwtSecret: str('JWT_SECRET', 'dev-only-secret-change-in-prod-' + crypto.randomBytes(8).toString('hex')),
  corsOrigins: list('CORS_ORIGINS', '*'),

  rateLimit: {
    windowMs: int('RATE_LIMIT_WINDOW_MS', 60_000),
    max: int('RATE_LIMIT_MAX', 120)
  },

  chain: {
    blockIntervalMs: int('BLOCK_INTERVAL_MS', 5000)
  },

  llm: {
    enabled: bool('LLM_ENABLED', true),
    model: str('LLM_MODEL', 'minimax/MiniMax-M2.7-highspeed'),
    timeoutMs: int('LLM_TIMEOUT_MS', 90_000)
  },

  dataDir: isAbsolute(str('DATA_DIR', ''))
    ? str('DATA_DIR')
    : resolve(ROOT, str('DATA_DIR', './data')),
  logLevel: str('LOG_LEVEL', 'info')
};

export const isProd = config.env === 'production';
