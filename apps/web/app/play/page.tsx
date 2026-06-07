import { GameBoard } from '@/components/GameBoard';
import { ApiGameState, apiRequest } from '@/lib/api';
import { BoardState, createBoardState, normalizeBoardState } from '@/lib/board';
import { pageMetadata } from '@/lib/metadata';
import { getSession } from '@/lib/session';

export const metadata = pageMetadata.play;

type PlayPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlayPage({ searchParams }: PlayPageProps) {
  const session = await getSession();
  const params = (await searchParams) ?? {};
  const replayParam = params.replay;
  const replayId = Array.isArray(replayParam) ? replayParam[0] : replayParam;
  const replayState =
    session && replayId
      ? await apiRequest<{
          bestMoves: number;
          bestTimeSeconds: number;
          board: BoardState;
          replayOfId: string;
        }>(
          `/leaderboard/completions/${encodeURIComponent(replayId)}/replay`,
        )
      : null;
  const savedState = session
    ? await apiRequest<{
        gameState: ApiGameState | null;
        highestReachedLevel: number;
      }>('/game-state')
    : null;
  const savedBoard = savedState?.gameState?.board as BoardState | undefined;
  const initialBoard = normalizeBoardState(
    replayState?.board ?? savedBoard ?? createBoardState(),
  );

  return (
    <section className="page-rail-wide mx-auto grid min-h-svh py-4">
      <GameBoard
        initialBoard={initialBoard}
        initialHighestReachedLevel={savedState?.highestReachedLevel}
        isSignedIn={Boolean(session)}
        playerAvatarUrl={session?.avatarUrl}
        playerName={session?.name}
        replayBest={
          replayState
            ? {
                moves: replayState.bestMoves,
                timeSeconds: replayState.bestTimeSeconds,
              }
            : undefined
        }
        replayOfId={replayState?.replayOfId}
      />
    </section>
  );
}
