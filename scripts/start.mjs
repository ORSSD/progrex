// Production start: runs the built worker with local D1 (database) and R2 (images)
// stored in DATA_DIR, so content survives redeploys when DATA_DIR is a mounted volume.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const dataDir = resolve(process.env.DATA_DIR || '.data');
mkdirSync(dataDir, { recursive: true });

const args = [
  'wrangler',
  'dev',
  '--config',
  'dist/server/wrangler.json',
  '--ip',
  '0.0.0.0',
  '--port',
  process.env.PORT || '3000',
  '--persist-to',
  dataDir,
  '--show-interactive-dev-session=false',
];

// Pass secrets from the container environment into the worker.
for (const name of ['ADMIN_PATH', 'ADMIN_PASSWORD', 'SESSION_SECRET', 'CLIENT_IP_HEADER']) {
  if (process.env[name]) args.push('--var', `${name}:${process.env[name]}`);
}
if (!process.env.ADMIN_PATH || !process.env.ADMIN_PASSWORD)
  console.warn('ADMIN_PATH and ADMIN_PASSWORD must both be set, or the admin stays unreachable.');

// `wrangler dev` is not hardened for production traffic, so restart it if it ever exits
// unexpectedly. Deploying to Cloudflare Workers would remove this layer entirely.
let child = null;
let stopping = false;
let restarts = [];

function start() {
  child = spawn('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('exit', (code, signal) => {
    if (stopping) return process.exit(code ?? 0);
    // If it keeps crashing (10 times in a minute), exit and let the container restart policy decide.
    const now = Date.now();
    restarts = restarts.filter((t) => now - t < 60_000).concat(now);
    if (restarts.length > 10) {
      console.error('[start] server keeps crashing; exiting.');
      return process.exit(1);
    }
    console.error(`[start] server exited (code=${code} signal=${signal}); restarting in 1s…`);
    setTimeout(start, 1000);
  });
}

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    stopping = true;
    child?.kill(sig);
  });
}

start();
