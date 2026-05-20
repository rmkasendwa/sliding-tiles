import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function GET() {
  const frog = await readFile(
    path.join(process.cwd(), 'main-ui', 'src', 'img', 'frog.svg')
  );

  return new Response(frog, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}
