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

const server = http.createServer((req, res) => {
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
  console.log('SPA server on', PORT, '->', DIST_DIR);
});
