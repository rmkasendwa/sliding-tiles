import { solveBoardSolverPayload } from '../lib/boardSolver';
import type {
  BoardSolverWorkerMessage,
  BoardSolverWorkerResponse,
} from '../lib/board-solver/protocol';

const cancelledRequests = new Set<string>();

function postResponse(response: BoardSolverWorkerResponse) {
  self.postMessage(response);
}

self.addEventListener(
  'message',
  (event: MessageEvent<BoardSolverWorkerMessage>) => {
    const message = event.data;

    if (message.type === 'cancel') {
      cancelledRequests.add(message.requestId);
      postResponse({
        requestId: message.requestId,
        type: 'cancelled',
      });
      return;
    }

    if (cancelledRequests.has(message.requestId)) {
      postResponse({
        requestId: message.requestId,
        type: 'cancelled',
      });
      return;
    }

    try {
      const outcome = solveBoardSolverPayload(message.payload);

      if (cancelledRequests.has(message.requestId)) {
        postResponse({
          requestId: message.requestId,
          type: 'cancelled',
        });
        return;
      }

      postResponse({
        outcome,
        requestId: message.requestId,
        type: 'result',
      });
    } catch (error) {
      postResponse({
        error:
          error instanceof Error
            ? error.message
            : 'The board solver failed unexpectedly.',
        requestId: message.requestId,
        type: 'error',
      });
    } finally {
      cancelledRequests.delete(message.requestId);
    }
  },
);
