import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath (not URL.pathname) so paths containing spaces resolve correctly.
const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const distRoot = path.join(projectRoot, 'dist');
// Route inventory written by scripts/build-priority-routes.mjs.
const inventory = JSON.parse(await fs.readFile(path.join(projectRoot, '.tmp', 'routes.json'), 'utf8'));
const pages = [
  ...inventory.pages.map((p) => ({ route: p.route })),
  ...inventory.redirects.map((r) => ({ route: r.route, target: r.target })),
];

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js') return 'text/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.woff2') return 'font/woff2';
  if (ext === '.woff') return 'font/woff';
  if (ext === '.ttf') return 'font/ttf';
  return 'application/octet-stream';
}

function resolveFile(urlPath) {
  const safePath = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const direct = path.join(distRoot, safePath);
  return safePath.endsWith('/') || !path.extname(safePath)
    ? path.join(direct, 'index.html')
    : direct;
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      const filePath = resolveFile(url.pathname);
      const relative = path.relative(distRoot, filePath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Invalid path');
      const body = await fs.readFile(filePath);
      res.writeHead(200, { 'content-type': contentType(filePath) });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('not found');
    }
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
  });
}

const { server, port } = await startServer();
const base = `http://127.0.0.1:${port}`;
const results = [];
try {
  for (const page of pages) {
    const response = await fetch(`${base}${page.route}`, { redirect: 'manual' });
    const text = await response.text();
    const passed = response.status === 200 && (page.target
      ? text.includes(`url=${page.target}`)
      : /<div id="root"><[a-z]/i.test(text));
    results.push({
      route: page.route,
      expected: page.target ? `assisted-commerce redirect shell to ${page.target}` : 'static page with rendered content',
      status: response.status,
      passed,
    });
  }
} finally {
  await new Promise(resolve => server.close(resolve));
}

const failed = results.filter(result => !result.passed);
if (failed.length) {
  console.error(`Direct route smoke failed for ${failed.length} route(s).`);
  for (const result of failed) console.error(`- ${result.route}: status ${result.status}, expected ${result.expected}`);
  process.exit(1);
}
console.log(`Direct route smoke passed for ${results.length} route(s).`);
