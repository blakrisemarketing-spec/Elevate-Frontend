/**
 * Perf bench: throttles to Regular 3G + 4x CPU, captures TTFB/FCP/LCP/transfer/Load.
 *
 * Regular 3G profile mirrors Lighthouse's "Slow 4G" preset which is the closest
 * stable target for Ghana mid-tier mobile traffic.
 *
 *   node scripts/perf-bench.mjs            # benches /
 *   node scripts/perf-bench.mjs /about/    # benches /about/
 *   node scripts/perf-bench.mjs --label=after /  # tags the saved JSON
 *
 * Serves dist/ over loopback with gzip middleware so the wire size matches
 * what Netlify/Vercel actually ship.
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';

const projectRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(projectRoot, 'dist');
const outDir = path.join(projectRoot, 'outputs', 'perf');

const args = process.argv.slice(2);
const labelArg = args.find(a => a.startsWith('--label='));
const label = labelArg ? labelArg.split('=')[1] : 'baseline';
const routes = args.filter(a => !a.startsWith('--'));
const targetRoutes = routes.length ? routes : ['/'];

const REGULAR_3G = {
  // Regular 3G per Lighthouse / WebPageTest: 750 Kbps down, 250 Kbps up, 300 ms RTT.
  download: 750 * 1024 / 8,
  upload: 250 * 1024 / 8,
  latencyMs: 300,
  cpuThrottle: 4,
};

const TEXT_TYPES = new Set(['text/html', 'text/css', 'text/javascript', 'application/javascript', 'application/json', 'image/svg+xml', 'text/plain']);

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js' || ext === '.mjs') return 'text/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.avif') return 'image/avif';
  if (ext === '.woff2') return 'font/woff2';
  if (ext === '.woff') return 'font/woff';
  if (ext === '.ttf') return 'font/ttf';
  if (ext === '.txt') return 'text/plain; charset=utf-8';
  if (ext === '.xml') return 'application/xml; charset=utf-8';
  return 'application/octet-stream';
}

function resolveFile(urlPath) {
  const safePath = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const direct = path.join(distRoot, safePath);
  if (safePath.endsWith('/') || !path.extname(safePath)) {
    return path.join(direct, 'index.html');
  }
  return direct;
}

function shouldGzip(ct) {
  const base = ct.split(';')[0].trim();
  return TEXT_TYPES.has(base) || base.startsWith('text/') || base === 'application/javascript' || base === 'application/json';
}

function startGzipServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      const filePath = resolveFile(url.pathname);
      const relative = path.relative(distRoot, filePath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('path escape');
      const body = await fs.readFile(filePath);
      const ct = contentType(filePath);
      const acceptsGzip = (req.headers['accept-encoding'] || '').includes('gzip');
      if (acceptsGzip && shouldGzip(ct) && body.length > 256) {
        const gz = zlib.gzipSync(body, { level: 9 });
        res.writeHead(200, {
          'content-type': ct,
          'content-encoding': 'gzip',
          'content-length': gz.length,
          'cache-control': 'public, max-age=3600',
        });
        res.end(gz);
      } else {
        res.writeHead(200, {
          'content-type': ct,
          'content-length': body.length,
          'cache-control': 'public, max-age=3600',
        });
        res.end(body);
      }
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

async function benchRoute(browser, baseUrl, route) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 10; Mobile; rv:91.0) Gecko/91.0 Firefox/91.0 ElevatePerfBench/1.0',
  });
  const page = await context.newPage();

  // Capture LCP reliably via PerformanceObserver injected before any page script.
  await page.addInitScript(() => {
    window.__lcp = 0;
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__lcp = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch { /* unsupported */ }
  });

  const client = await context.newCDPSession(page);

  await client.send('Network.enable');
  await client.send('Network.clearBrowserCache');
  await client.send('Network.clearBrowserCookies');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: REGULAR_3G.latencyMs,
    downloadThroughput: REGULAR_3G.download,
    uploadThroughput: REGULAR_3G.upload,
  });
  await client.send('Emulation.setCPUThrottlingRate', { rate: REGULAR_3G.cpuThrottle });

  const requests = [];
  client.on('Network.responseReceived', e => {
    requests.push({
      url: e.response.url,
      mime: e.response.mimeType,
      status: e.response.status,
      encodedDataLength: 0,
      reqId: e.requestId,
    });
  });
  client.on('Network.loadingFinished', e => {
    const r = requests.find(r => r.reqId === e.requestId);
    if (r) r.encodedDataLength = e.encodedDataLength;
  });

  const url = new URL(route, baseUrl).href;
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 60_000 });

  // Wait one extra frame so LCP candidate stabilizes
  await page.waitForTimeout(500);

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paints = performance.getEntriesByType('paint');
    const fp = paints.find(p => p.name === 'first-paint')?.startTime ?? null;
    const fcp = paints.find(p => p.name === 'first-contentful-paint')?.startTime ?? null;
    let lcp = window.__lcp || null;
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length) lcp = lcpEntries[lcpEntries.length - 1].startTime;
    } catch {}
    return {
      ttfbMs: nav ? Math.round(nav.responseStart) : null,
      domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      loadMs: nav ? Math.round(nav.loadEventEnd) : null,
      firstPaintMs: fp ? Math.round(fp) : null,
      firstContentfulPaintMs: fcp ? Math.round(fcp) : null,
      largestContentfulPaintMs: lcp ? Math.round(lcp) : null,
      transferSizeBytes: nav?.transferSize ?? null,
      encodedBodySizeBytes: nav?.encodedBodySize ?? null,
      decodedBodySizeBytes: nav?.decodedBodySize ?? null,
    };
  });

  const wallClockMs = Date.now() - t0;
  const totalEncodedBytes = requests.reduce((sum, r) => sum + (r.encodedDataLength || 0), 0);

  // Top-15 largest transfers for diagnostic
  const top = requests
    .filter(r => r.encodedDataLength > 0)
    .sort((a, b) => b.encodedDataLength - a.encodedDataLength)
    .slice(0, 15)
    .map(r => ({ url: r.url.replace(baseUrl, ''), mime: r.mime, bytes: r.encodedDataLength }));

  await context.close();
  return {
    route,
    wallClockMs,
    requestCount: requests.length,
    totalEncodedBytes,
    totalEncodedKB: +(totalEncodedBytes / 1024).toFixed(1),
    ...metrics,
    topResources: top,
  };
}

const { server, port } = await startGzipServer();
const baseUrl = `http://127.0.0.1:${port}`;
console.log(`[bench] gzip server on ${baseUrl} (Regular 3G: ${(REGULAR_3G.download * 8 / 1024).toFixed(0)} Kbps, ${REGULAR_3G.latencyMs}ms RTT, ${REGULAR_3G.cpuThrottle}x CPU)`);

let exitCode = 0;
try {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const route of targetRoutes) {
    process.stdout.write(`[bench] ${route} ... `);
    const result = await benchRoute(browser, baseUrl, route);
    results.push(result);
    // Verdict is on LCP (the Core Web Vitals "loaded" metric the user perceives),
    // not the load event — below-the-fold lazy images finish after load and a real
    // browser defers them until scroll, so loadMs over-counts. loadMs stays in the
    // report as a secondary signal.
    const target = 2000;
    const lcp = result.largestContentfulPaintMs;
    const ok = lcp !== null && lcp <= target;
    console.log(`LCP=${lcp}ms FCP=${result.firstContentfulPaintMs}ms load=${result.loadMs}ms transfer=${result.totalEncodedKB}KB ${ok ? 'PASS' : 'OVER'}`);
    if (!ok) exitCode = 1;
  }
  await browser.close();

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(outDir, `perf-${label}-${stamp}.json`);
  await fs.mkdir(outDir, { recursive: true, mode: 0o700 });
  await fs.writeFile(outFile, JSON.stringify({
    label,
    generatedAt: new Date().toISOString(),
    profile: { name: 'Regular 3G', ...REGULAR_3G },
    targetLoadMs: 2000,
    results,
  }, null, 2));
  console.log(`[bench] wrote ${path.relative(projectRoot, outFile)}`);
} finally {
  await new Promise(resolve => server.close(resolve));
}

process.exit(exitCode);
