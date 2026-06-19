import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';

import ts from 'typescript';

function compileWebModules() {
  const outputDir = mkdtempSync(join(tmpdir(), 'sliding-tiles-solver-'));
  const modules = [
    'apps/web/lib/board.ts',
    'apps/web/lib/boardSolver.ts',
  ];

  for (const sourcePath of modules) {
    const source = readFileSync(sourcePath, 'utf8');
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: sourcePath,
    });

    writeFileSync(
      join(outputDir, sourcePath.endsWith('board.ts') ? 'board.js' : 'boardSolver.js'),
      compiled.outputText,
    );
  }

  return outputDir;
}

async function loadSolverModules() {
  const outputDir = compileWebModules();

  try {
    const [board, solver] = await Promise.all([
      import(pathToFileURL(join(outputDir, 'board.js'))),
      import(pathToFileURL(join(outputDir, 'boardSolver.js'))),
    ]);

    return { board, outputDir, solver };
  } catch (error) {
    rmSync(outputDir, { force: true, recursive: true });
    throw error;
  }
}

test('solves a serializable board payload without React state', async () => {
  const { board, outputDir, solver } = await loadSolverModules();

  try {
    let puzzle = {
      dimensions: [3, 2],
      elapsedTimeMs: 0,
      emptySlot: [1, 2],
      level: 1,
      movableSlots: [
        [0, 2],
        [1, 1],
      ],
      moves: 0,
      startedAt: '2026-06-19T00:00:00.000Z',
      tileGrid: board.createSolvedTileGrid([3, 2]),
    };

    for (const slot of [
      [1, 1],
      [1, 0],
      [0, 0],
    ]) {
      puzzle = board.moveBoardTile(puzzle, slot);
    }

    const payload = solver.createBoardSolverPayload(puzzle);
    assert.ok(payload);
    assert.deepEqual(payload.dimensions, [3, 2]);
    assert.deepEqual(payload.targetState, [0, 1, 2, 3, 4, 5]);

    const outcome = solver.solveBoardSolverPayload(payload);
    assert.equal(outcome.status, 'solved');
    assert.ok(outcome.moves.length > 0);

    const solvedPuzzle = outcome.moves.reduce(
      (currentBoard, slot) => board.moveBoardTile(currentBoard, slot),
      puzzle,
    );

    assert.equal(board.isTileGridInOrder(solvedPuzzle.tileGrid), true);
  } finally {
    rmSync(outputDir, { force: true, recursive: true });
  }
});

test('rejects invalid serializable solver payloads', async () => {
  const { outputDir, solver } = await loadSolverModules();

  try {
    const outcome = solver.solveBoardSolverPayload({
      boardState: [0, 1, 1, 3, 4, 5],
      dimensions: [3, 2],
      emptySlot: [1, 2],
      targetState: [0, 1, 2, 3, 4, 5],
    });

    assert.equal(outcome.status, 'invalid');
  } finally {
    rmSync(outputDir, { force: true, recursive: true });
  }
});
