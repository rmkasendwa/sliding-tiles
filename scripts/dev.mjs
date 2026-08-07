import 'dotenv/config';

import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';

const webPort = process.env.WEB_PORT || process.env.PORT || '3000';
const apiPort = process.env.API_PORT || '4001';
const processes = new Set();
let shuttingDown = false;
const npmCli = process.env.npm_execpath;

if (!npmCli) {
  throw new Error('Run this development launcher through `npm run dev`.');
}

const npmCommand = process.execPath;

function npmArgs(...args) {
  return [npmCli, ...args];
}

function spawnProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    detached: options.detached ?? false,
    env: { ...process.env, ...options.env },
    stdio: 'inherit',
  });

  processes.add(child);
  return child;
}

function run(command, args, options = {}) {
  const child = spawnProcess(command, args, {
    ...options,
    detached: process.platform !== 'win32',
  });

  child.on('exit', (code, signal) => {
    processes.delete(child);
    if (!shuttingDown) {
      void shutdown(signal ? 0 : (code ?? 0));
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

function checkPortHost(label, port, host) {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host, port });
    const finish = (callback, value) => {
      socket.destroy();
      callback(value);
    };

    socket.setTimeout(500);
    socket.once('connect', () => {
      finish(
        reject,
        new Error(
          `${label} port ${port} is already in use. Stop the existing development server and retry.`,
        ),
      );
    });
    socket.once('error', () => finish(resolve));
    socket.once('timeout', () => finish(resolve));
  });
}

async function assertPortAvailable(label, portValue) {
  const port = Number(portValue);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${label} port must be a number between 1 and 65535.`);
  }

  await Promise.all([
    checkPortHost(label, port, '127.0.0.1'),
    checkPortHost(label, port, '::1'),
  ]);
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const onExit = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);
    const finish = (exited) => {
      clearTimeout(timer);
      child.off('exit', onExit);
      resolve(exited);
    };

    child.once('exit', onExit);
  });
}

function runTaskkill(child, force = false) {
  return new Promise((resolve) => {
    const args = force ? ['/F', '/PID'] : ['/PID'];
    const taskkill = spawn(
      'taskkill',
      [...args, String(child.pid), '/T'],
      { stdio: 'ignore', windowsHide: true },
    );

    taskkill.once('error', resolve);
    taskkill.once('exit', resolve);
  });
}

async function stopProcessTree(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  if (process.platform === 'win32') {
    await runTaskkill(child);

    if (!(await waitForExit(child, 1500))) {
      await runTaskkill(child, true);
      await waitForExit(child, 1500);
    }
    return;
  }

  process.kill(-child.pid, 'SIGTERM');

  if (!(await waitForExit(child, 5000))) {
    process.kill(-child.pid, 'SIGKILL');
    await waitForExit(child, 1000);
  }
}

async function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  const runningProcesses = [...processes];

  if (runningProcesses.length) {
    console.log('\n[dev] Stopping development servers...');
    await Promise.all(runningProcesses.map(stopProcessTree));
  }

  process.exit(code);
}

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

try {
  await Promise.all([
    assertPortAvailable('Web', webPort),
    assertPortAvailable('API', apiPort),
  ]);

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
    'run',
    '--rm',
    '--no-deps',
    '-T',
    'minio-init',
  ]);
  await runStep(
    'Applying pending database migrations',
    npmCommand,
    npmArgs('run', '--silent', 'db:migrate:deploy'),
  );
  await runStep(
    'Generating Prisma Client',
    npmCommand,
    npmArgs('run', '--silent', 'db:generate'),
  );

  console.log('\n[dev] Starting API and web development servers');
  run(npmCommand, npmArgs('run', '--silent', 'api:dev'));
  run(npmCommand, npmArgs('run', '--silent', 'web:dev'), {
    env: { PORT: webPort },
  });
} catch (error) {
  console.error(`\n[dev] ${error.message}`);
  await shutdown(1);
}
