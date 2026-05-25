import 'dotenv/config';

import { spawn } from 'node:child_process';

const webPort = process.env.WEB_PORT || process.env.PORT || '3000';
const processes = new Set();

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    env: { ...process.env, ...options.env },
    shell: false,
    stdio: 'inherit',
  });

  processes.add(child);
  child.on('exit', (code, signal) => {
    processes.delete(child);
    if (signal || code) {
      shutdown(signal ? 0 : code ?? 1);
    }
  });

  return child;
}

function shutdown(code = 0) {
  for (const child of processes) {
    child.kill('SIGTERM');
  }

  process.exit(code);
}

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());

const database = spawn('docker', ['compose', 'up', '-d', 'postgres'], {
  stdio: 'inherit',
});

database.on('exit', (code) => {
  if (code) {
    process.exit(code);
  }

  run('npm', ['run', 'api:dev']);
  run('npm', ['run', 'web:dev'], { env: { PORT: webPort } });
});
