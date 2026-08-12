import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../../..');
const envPath = path.join(workspaceRoot, '.env');

dotenv.config({ path: envPath });

const storybookPort = process.env.STORYBOOK_PORT || '6006';
const port = Number(storybookPort);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('STORYBOOK_PORT must be a number between 1 and 65535.');
}

const storybook = spawn('storybook', ['dev', '-p', String(port), '--no-open'], {
  env: process.env,
  stdio: 'inherit',
});

storybook.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
