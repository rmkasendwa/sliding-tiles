import type { BoardSolverPayload, SolverOutcome } from '../boardSolver';

export type BoardSolverRequestMessage = {
  payload: BoardSolverPayload;
  requestId: string;
  type: 'solve';
};

export type BoardSolverCancelMessage = {
  requestId: string;
  type: 'cancel';
};

export type BoardSolverWorkerMessage =
  | BoardSolverRequestMessage
  | BoardSolverCancelMessage;

export type BoardSolverSuccessMessage = {
  outcome: SolverOutcome;
  requestId: string;
  type: 'result';
};

export type BoardSolverErrorMessage = {
  error: string;
  requestId: string;
  type: 'error';
};

export type BoardSolverCancelledMessage = {
  requestId: string;
  type: 'cancelled';
};

export type BoardSolverWorkerResponse =
  | BoardSolverSuccessMessage
  | BoardSolverErrorMessage
  | BoardSolverCancelledMessage;
