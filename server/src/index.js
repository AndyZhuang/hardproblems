// HardProblems.World 后端入口
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { readFileSync } from 'fs';
import { config, isProd } from './config.js';
import { logger } from './logger.js';
import { startBlockMaker, validateChain } from './blockchain.js';
import { router as usersRouter } from './routes/users.js';
import { router as problemsRouter } from './routes/problems.js';
import { router as solutionsRouter } from './routes/solutions.js';
import { router as leaderboardRouter } from './routes/leaderboard.js';
import { router as chainRouter } from './routes/chain.js';
import { router as aiRouter } from './routes/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const log = logger.child('server');

const SERVER_START_TIME = Date.now();
let pkg = { name: 'hardproblems', version: '1.0.0' };
try {
  pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
} catch {}

// 启动
const app = express();

// =============== 中间件 ===============

app.set('trust proxy', 1);
app.disable('x-powered-by');

// 安全头
app.use(helmet({
  contentSecurityPolicy: false, // 由 Nginx 接管
  crossOriginEmbedderPolicy: false
}));

// 压缩
app.use(compression());

// CORS
const corsOrigins = config.corsOrigins;
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (corsOrigins.includes('*')) return cb(null, true);
    if (corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());

// 限流
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// 请求日志
if (!isProd) {
  app.use((req, _res, next) => {
    log.debug(`${req.method} ${req.path}`);
    next();
  });
}

// =============== 路由 ===============

app.get('/api', (_req, res) => {
  res.json({
    name: pkg.name,
    version: pkg.version,
    description: 'HardProblems.World API',
    endpoints: {
      health: '/api/health',
      version: '/api/version',
      problems: '/api/problems',
      problemsDetail: '/api/problems/:id',
      solutions: '/api/solutions',
      vote: '/api/solutions/:id/vote',
      register: 'POST /api/users/register',
      login: 'POST /api/users/login',
      leaderboard: '/api/leaderboard',
      chain: '/api/chain/info',
      ai_solve: 'POST /api/ai/solve',
      ai_evaluate: 'POST /api/ai/evaluate'
    }
  });
});

app.get('/api/health', (_req, res) => {
  const validation = validateChain();
  const mem = process.memoryUsage();
  res.json({
    ok: true,
    time: Date.now(),
    env: config.env,
    version: pkg.version,
    name: pkg.name,
    uptime: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
    pid: process.pid,
    node: process.version,
    chain: validation,
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024)
    }
  });
});

app.get('/api/version', (_req, res) => {
  res.json({ name: pkg.name, version: pkg.version, env: config.env });
});

// HPW 链上合约状态
app.get('/api/hpw/status', async (_req, res) => {
  const { getHPWStatus, HPW_CONFIG } = await import('./hpw.js');
  const status = await getHPWStatus();
  res.json({ ...status, config: HPW_CONFIG });
});

app.use('/api/users', usersRouter);
app.use('/api/problems', problemsRouter);
app.use('/api/solutions', solutionsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/chain', chainRouter);
app.use('/api/ai', aiRouter);

// 静态前端
const clientDist = join(__dirname, '..', '..', 'client', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist, {
    maxAge: isProd ? '1d' : 0,
    etag: true
  }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(join(clientDist, 'index.html'));
  });
  log.info('serving client dist');
} else {
  log.warn('client dist not found, run "npm run build" in client/ first');
}

// 404
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found: ' + req.path });
});

// 错误处理
app.use((err, _req, res, _next) => {
  log.error('unhandled error', { msg: err.message, stack: isProd ? undefined : err.stack });
  if (res.headersSent) return;
  res.status(err.status || 500).json({
    error: isProd ? 'Internal server error' : err.message
  });
});

// =============== 启动 + 优雅关闭 ===============
const server = app.listen(config.port, config.host, () => {
  const banner = [
    '',
    '╔══════════════════════════════════════════════════╗',
    '║           HardProblems.World  v' + pkg.version.padEnd(3) + '              ║',
    '║   AI-solvable hard problems × on-chain rewards  ║',
    '╠══════════════════════════════════════════════════╣',
    `║  ENV      : ${config.env.padEnd(38)}║`,
    `║  URL      : http://${config.host}:${String(config.port).padEnd(28)}║`,
    `║  DATA     : ${config.dataDir.slice(-38).padEnd(38)}║`,
    `║  CHAIN    : every ${String(config.chain.blockIntervalMs).padEnd(5)}ms                       ║`,
    `║  CORS     : ${config.corsOrigins.join(',').slice(0, 38).padEnd(38)}║`,
    '╚══════════════════════════════════════════════════╝',
    ''
  ].join('\n');
  console.log(banner);
  log.info(`api listening on http://${config.host}:${config.port} (env=${config.env})`);
  startBlockMaker();
});

function shutdown(signal) {
  log.info(`received ${signal}, shutting down gracefully...`);
  server.close(() => {
    log.info('http server closed');
    process.exit(0);
  });
  // 强退兜底
  setTimeout(() => {
    log.warn('forcing exit after 10s');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  log.error('unhandledRejection', { reason: String(reason) });
});
process.on('uncaughtException', (err) => {
  log.error('uncaughtException', { msg: err.message, stack: err.stack });
});
