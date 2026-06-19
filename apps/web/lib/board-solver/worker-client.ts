import type { BoardSolverPayload, SolverOutcome } from '../boardSolver';
import type {
  BoardSolverRequestMessage,
  BoardSolverWorkerMessage,
  BoardSolverWorkerResponse,
} from './protocol';

type WorkerFactory = () => Worker;

type ActiveSolve = {
  reject: (error: Error) => void;
  requestId: string;
  timeoutId: number | null;
  worker: Worker;
};

const DEFAULT_SOLVER_TIMEOUT_MS = 30_000;

function createBoardSolverWorker() {
  return new Worker(new URL('../../workers/board-solver.worker.ts', import.meta.url), {
    name: 'board-solver',
    type: 'module',
  });
}

function createCancellationError(reason: string) {
  return new Error(reason);
}

export class BoardSolverWorkerClient {
  private activeSolve: ActiveSolve | null = null;
  private readonly createWorker: WorkerFactory;
  private requestSequence = 0;

  constructor(createWorker: WorkerFactory = createBoardSolverWorker) {
    this.createWorker = createWorker;
  }

  cancel(reason = 'The board solve was cancelled.') {
    if (!this.activeSolve) {
      return;
    }

    const activeSolve = this.activeSolve;
    this.activeSolve = null;

    if (activeSolve.timeoutId !== null) {
      window.clearTimeout(activeSolve.timeoutId);
    }

    const cancelMessage: BoardSolverWorkerMessage = {
      requestId: activeSolve.requestId,
      type: 'cancel',
    };

    try {
      activeSolve.worker.postMessage(cancelMessage);
    } catch {
      // Terminating below is the hard cancellation path for busy workers.
    }

    activeSolve.worker.terminate();
    activeSolve.reject(createCancellationError(reason));
  }

  solve(
    payload: BoardSolverPayload,
    options: { timeoutMs?: number } = {},
  ): Promise<SolverOutcome> {
    this.cancel('A newer board solve was started.');

    const requestId = `board-solve-${Date.now()}-${this.requestSequence++}`;
    const worker = this.createWorker();

    return new Promise<SolverOutcome>((resolve, reject) => {
      const cleanup = () => {
        if (this.activeSolve?.requestId === requestId) {
          if (this.activeSolve.timeoutId !== null) {
            window.clearTimeout(this.activeSolve.timeoutId);
          }
          this.activeSolve.worker.terminate();
          this.activeSolve = null;
        } else {
          worker.terminate();
        }
      };

      const handleMessage = (event: MessageEvent<BoardSolverWorkerResponse>) => {
        const message = event.data;

        if (message.requestId !== requestId) {
          return;
        }

        cleanup();

        if (message.type === 'result') {
          resolve(message.outcome);
          return;
        }

        if (message.type === 'cancelled') {
          reject(createCancellationError('The board solve was cancelled.'));
          return;
        }

        reject(new Error(message.error));
      };

      const handleError = () => {
        cleanup();
        reject(new Error('The board solver stopped unexpectedly.'));
      };

      const timeoutId = window.setTimeout(() => {
        this.cancel('The board solver took too long to respond.');
      }, options.timeoutMs ?? DEFAULT_SOLVER_TIMEOUT_MS);

      this.activeSolve = {
        reject,
        requestId,
        timeoutId,
        worker,
      };

      worker.addEventListener('message', handleMessage, { once: false });
      worker.addEventListener('error', handleError, { once: true });
      worker.addEventListener('messageerror', handleError, { once: true });

      const requestMessage: BoardSolverRequestMessage = {
        payload,
        requestId,
        type: 'solve',
      };

      worker.postMessage(requestMessage);
    });
  }
}
