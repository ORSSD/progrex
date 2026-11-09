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
for (const name of ['ADMIN_PASSWORD', 'SESSION_SECRET']) {
  if (process.env[name]) args.push('--var', `${name}:${process.env[name]}`);
}
if (!process.env.ADMIN_PASSWORD) console.warn('ADMIN_PASSWORD is not set — /admin will stay locked.');

const child = spawn('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
child.on('exit', (code) => process.exit(code ?? 0));
