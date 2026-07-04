import { spawn } from 'node:child_process';

const processes = new Set();

function runOnce(name, command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: 'inherit',
    });

    child.on('exit', (code, signal) => {
      if (signal || code) {
        reject(new Error(`${name} exited with ${signal ?? code}`));
        return;
      }

      resolve();
    });
  });
}

function run(name, command, args) {
  const child = spawn(command, args, {
    env: process.env,
    stdio: 'inherit',
  });

  processes.add(child);
  child.on('exit', (code, signal) => {
    processes.delete(child);

    if (signal || code) {
      shutdown(signal ? 0 : code ?? 1);
    }
  });

  console.log(`[container] started ${name}`);
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

process.env.API_PORT ||= '4001';
process.env.PORT ||= process.env.WEB_PORT || '3000';
process.env.API_BASE_URL ||= `http://localhost:${process.env.API_PORT}/api`;

if (process.env.RUN_MIGRATIONS !== 'false') {
  console.log('[container] running database migrations');
  await runOnce('database migrations', 'node', [
    'node_modules/prisma/build/index.js',
    'migrate',
    'deploy',
  ]);
}

run('api', 'node', ['dist/api/main.js']);
run('web', 'node', ['apps/web/server.js']);
