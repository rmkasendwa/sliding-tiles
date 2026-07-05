import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import nft from 'next/dist/compiled/@vercel/nft/index.js';

const { nodeFileTrace } = nft;

const root = process.cwd();
const output = path.join(root, 'runtime');
const entries = [
  'dist/api/main.js',
  'node_modules/dotenv/config.js',
  'node_modules/prisma/build/index.js',
  'node_modules/prisma/config.js',
];

const { fileList, warnings } = await nodeFileTrace(entries, {
  base: root,
  processCwd: root,
});

if (warnings.size) {
  console.warn(`[trace] ignored ${warnings.size} optional or non-JavaScript dependencies`);
}

for (const relativePath of fileList) {
  const source = path.join(root, relativePath);
  const destination = path.join(output, relativePath);

  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

console.log(`[trace] copied ${fileList.size} API and migration runtime files`);
