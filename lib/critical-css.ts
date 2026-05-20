import { readFile } from 'node:fs/promises';
import path from 'node:path';

const criticalCssPath = path.join(process.cwd(), 'app', 'critical.css');

let productionCriticalCss: string | null = null;

export async function getCriticalCss() {
  if (process.env.NODE_ENV === 'production') {
    productionCriticalCss ??= await readFile(criticalCssPath, 'utf8');
    return productionCriticalCss;
  }

  return readFile(criticalCssPath, 'utf8');
}
