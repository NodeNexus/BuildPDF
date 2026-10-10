/**
 * Lightweight local preview server for testing Android updates & CORS
 * Zero dependencies - uses pure Node.js standard library.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.apk': 'application/vnd.android.package-archive',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Extract path and decode URI
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(reqUrl.pathname);

  // Normalize path
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const filePath = path.join(ROOT_DIR, pathname);

  // Security: Prevent directory traversal outside root
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Handle CORS Preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Headers replicating Render's static site configuration
    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Content-Type-Options': 'nosniff'
    };

    if (pathname === '/update.json') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else if (pathname.startsWith('/downloads/')) {
      headers['Cache-Control'] = 'public, max-age=86400';
    }

    res.writeHead(200, headers);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    console.log(`[${new Date().toISOString()}] 200 OK: ${pathname} (${contentType})`);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Android Update Host running locally at:`);
  console.log(`   👉 http://localhost:${PORT}`);
  console.log(`   👉 http://localhost:${PORT}/update.json (CORS enabled)`);
  console.log(`   👉 http://localhost:${PORT}/downloads/app-release.apk`);
  console.log(`======================================================\n`);
});
