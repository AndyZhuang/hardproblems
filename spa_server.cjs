// Quick SPA-aware static server
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = 'C:\\Users\\P1\\Desktop\\hardproblems\\client\\dist';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json'
};

// 简易 /api 代理：把请求转给 4000 后端
const BACKEND = process.env.BACKEND_URL || 'http://127.0.0.1:4000';

function proxyApi(req, res) {
  const opts = {
    hostname: '127.0.0.1',
    port: 4000,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: '127.0.0.1:4000' }
  };
  const proxyReq = http.request(opts, proxyRes => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', e => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'proxy error: ' + e.message }));
  });
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  // /api/* 代理到后端
  if (req.url.startsWith('/api/') || req.url === '/api') {
    return proxyApi(req, res);
  }
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  let filePath = path.join(DIST, url);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      if (fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
      } else {
        filePath = path.join(DIST, 'index.html');
      }
    }
    const ext = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(500); res.end('Error'); return; }
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    });
  });
});

const PORT = process.env.PORT || process.argv[2] || 8124;
const DIST_DIR = process.argv[3] || DIST;
server.listen(PORT, '127.0.0.1', () => {
  console.log('SPA server on', PORT, '->', DIST_DIR, '(api proxy ->', BACKEND + ')');
});
