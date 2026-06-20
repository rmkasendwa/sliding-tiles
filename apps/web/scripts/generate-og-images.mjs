import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

import { ImageResponse } from 'next/og.js';
import React from 'react';
import ts from 'typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const buildDir = path.join(webRoot, '.next', 'og-build');
const outputDir = path.join(webRoot, 'public', 'og');
const siteName = 'Sliding Tiles';

function formatDiagnostics(diagnostics) {
  return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => webRoot,
    getNewLine: () => '\n',
  });
}

async function importTypeScriptModule(relativePath) {
  const sourcePath = path.join(webRoot, relativePath);
  const outputPath = path.join(
    buildDir,
    relativePath.replace(/\.(ts|tsx)$/, '.mjs'),
  );
  const source = await readFile(sourcePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
    reportDiagnostics: true,
  });
  const diagnostics =
    transpiled.diagnostics?.filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    ) ?? [];

  if (diagnostics.length > 0) {
    throw new Error(formatDiagnostics(diagnostics));
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, transpiled.outputText);

  return import(`${pathToFileURL(outputPath).href}?t=${Date.now()}`);
}

async function main() {
  const [{ ogPages }, { OpenGraphImage, ogImageSize }] = await Promise.all([
    importTypeScriptModule('lib/og-pages.ts'),
    importTypeScriptModule('lib/og-image.tsx'),
  ]);

  await mkdir(outputDir, { recursive: true });

  for (const [key, page] of Object.entries(ogPages)) {
    const response = new ImageResponse(
      React.createElement(OpenGraphImage, page),
      ogImageSize,
    );
    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = path.join(outputDir, page.file);

    await writeFile(filePath, buffer);
    console.log(`[og] generated ${path.relative(webRoot, filePath)} for ${key}`);
  }

  console.log(
    `[og] generated ${Object.keys(ogPages).length} ${ogImageSize.width}x${ogImageSize.height} PNG images for ${siteName}`,
  );
}

main().catch((error) => {
  console.error('[og] image generation failed');
  console.error(error);
  process.exitCode = 1;
});
