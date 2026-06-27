/**
 * Local full-stack preview: serves the built dist/ with PHP, so the checkout
 * island AND the /api/verify-payment.php endpoint work together, the real
 * deploy shape (Hostinger = LiteSpeed + PHP).
 *
 * Loads .env / .env.local into the PHP process so the endpoint has the
 * Paystack secret + toSend key at runtime.
 *
 *   pnpm build && pnpm serve:php        # http://localhost:8080
 *   PORT=9000 pnpm serve:php            # custom port
 *
 * NOTE: with TOSEND_API_KEY set, a SUCCESSFUL test payment sends REAL emails
 * to OPS_EMAIL + the buyer. Remove it from .env.local to make emails log-only.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath (not URL.pathname) so paths containing spaces or other
// URL-encoded characters, e.g. ".../01. GitHub/...", resolve correctly.
const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const env = { ...process.env };
for (const file of ['.env', '.env.local']) {
  try {
    for (const line of fs.readFileSync(path.join(projectRoot, file), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* file optional */ }
}

const distDir = path.join(projectRoot, 'dist');
if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('[serve:php] dist/ not found, run `pnpm build` first.');
  process.exit(1);
}

const port = process.env.PORT || '8080';
const hasSecret = !!env.PAYSTACK_SECRET_KEY;
const hasTosend = !!env.TOSEND_API_KEY;
console.log(`[serve:php] http://localhost:${port}  (also on your LAN IP:${port})`);
console.log(`[serve:php] Paystack secret: ${hasSecret ? 'set' : 'MISSING (verify → 503)'} | toSend: ${hasTosend ? 'set, successful test payments send REAL emails' : 'unset (emails log only)'}`);

const child = spawn('php', ['-S', `0.0.0.0:${port}`, '-t', 'dist'], { cwd: projectRoot, stdio: 'inherit', env });
child.on('exit', (code) => process.exit(code ?? 0));
