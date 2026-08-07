import 'dotenv/config';

import { spawn } from 'node:child_process';

const webPort = process.env.WEB_PORT || process.env.PORT || '3000';
const processes = new Set();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function spawnProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    env: { ...process.env, ...options.env },
    stdio: 'inherit',
  });

  processes.add(child);
  return child;
}

function run(command, args, options = {}) {
  const child = spawnProcess(command, args, options);

  child.on('exit', (code, signal) => {
    processes.delete(child);
    if (signal || code) {
      shutdown(signal ? 0 : (code ?? 1));
    }
  });

  return child;
}

function runStep(label, command, args) {
  console.log(`\n[dev] ${label}`);

  return new Promise((resolve, reject) => {
    const child = spawnProcess(command, args);

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      processes.delete(child);

      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          signal
            ? `${label} was terminated by ${signal}`
            : `${label} failed with exit code ${code ?? 1}`,
        ),
      );
    });
  });
}

function shutdown(code = 0) {
  for (const child of processes) {
    child.kill('SIGTERM');
  }

  process.exit(code);
}

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());

try {
  await runStep('Starting local infrastructure', 'docker', [
    'compose',
    'up',
    '-d',
    '--wait',
    'postgres',
    'minio',
  ]);
  await runStep('Creating the local object-storage bucket', 'docker', [
    'compose',
    'up',
    'minio-init',
  ]);
  await runStep('Applying pending database migrations', npmCommand, [
    'run',
    'db:migrate:deploy',
  ]);
  await runStep('Generating Prisma Client', npmCommand, ['run', 'db:generate']);

  console.log('\n[dev] Starting API and web development servers');
  run(npmCommand, ['run', 'api:dev']);
  run(npmCommand, ['run', 'web:dev'], { env: { PORT: webPort } });
} catch (error) {
  console.error(`\n[dev] ${error.message}`);
  shutdown(1);
}
