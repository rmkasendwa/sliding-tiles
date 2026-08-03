import { CalendarDays, Trophy } from 'lucide-react';
import Link from 'next/link';

import { DailyChallengeRankingsSummary } from '@/components/DailyChallengePodium';
import { GameBoard } from '@/components/GameBoard';
import {
  ApiDailyChallengeMineResponse,
  ApiDailyChallengeResponse,
  apiRequest,
  getApiMessage,
} from '@/lib/api';
import {
  createDailyChallengeBoard,
  getDailyChallengeDateKey,
} from '@/lib/board';
import { pageMetadata } from '@/lib/metadata';
import { routes } from '@/lib/routes';
import { getSession } from '@/lib/session';

export const metadata = {
  ...pageMetadata.play,
  title: 'Daily Challenge | Sliding Tiles',
};

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatChallengeDate(dateKey: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00.000Z`));
}

export default async function DailyChallengePage() {
  const session = await getSession();
  const challengeDate = getDailyChallengeDateKey();
  const initialBoard = createDailyChallengeBoard(challengeDate);
  let daily: ApiDailyChallengeResponse | null = null;
  let mine: ApiDailyChallengeMineResponse | null = null;
  let loadError: string | null = null;

  try {
    daily = await apiRequest<ApiDailyChallengeResponse>(
      `/leaderboard/daily?date=${challengeDate}&take=50`,
      { token: null },
    );
    if (session) {
      mine = await apiRequest<ApiDailyChallengeMineResponse>(
        `/leaderboard/daily/mine?date=${challengeDate}`,
      );
    }
  } catch (error) {
    loadError =
      getApiMessage(error) ?? 'Unable to load the daily challenge right now.';
  }

  const scores = daily?.scores ?? [];
  const submittedScore = mine?.score ?? null;
  const currentUserRank = mine?.rank ?? null;

  return (
    <>
      {submittedScore ? (
        <section className="page-rail mx-auto grid min-h-[calc(100svh-72px)] place-items-center py-4">
          <div className="grid max-w-lg justify-items-center gap-3">
            <span className="grid size-14 place-items-center rounded-full border border-success/35 bg-panel text-success-strong">
              <Trophy aria-hidden="true" className="size-7" />
            </span>
            <h2 className="text-[clamp(1.9rem,5vw,2.8rem)] leading-tight">
              Daily complete
            </h2>
            <p className="text-sm font-bold text-foreground">
              {submittedScore.moves} moves ·{' '}
              {formatDuration(submittedScore.timeSeconds)}
              {currentUserRank ? ` · Rank #${currentUserRank}` : ''}
            </p>
            <p className="max-w-md text-sm text-center leading-6 text-muted">
              This score is locked for today. A new shared puzzle appears at the
              next UTC daily reset.
            </p>
          </div>
        </section>
      ) : (
        <section className="page-rail-wide mx-auto grid min-h-svh py-4">
          <GameBoard
            dailyChallenge={{ challengeDate }}
            initialBoard={initialBoard}
            initialHighestReachedLevel={initialBoard.level}
            isSignedIn={Boolean(session)}
            playerAvatarUrl={session?.avatarUrl}
            playerName={session?.name}
          />
        </section>
      )}

      <section
        className="page-rail mx-auto grid gap-5 scroll-mt-24 pb-12 pt-5"
        id="daily-rankings"
      >
        <div className="grid gap-4 rounded-lg border border-accent/18 bg-panel p-4 shadow-panel min-[920px]:grid-cols-[minmax(0,1fr)_auto] min-[920px]:items-end">
          <div className="grid gap-2">
            <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
              Daily challenge
            </p>
            <h1 className="text-[clamp(2.1rem,5vw,4rem)] leading-none">
              {formatChallengeDate(challengeDate)}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Same puzzle for everyone, ranked by completion time and then move
              count. Your first successful submission is final.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 min-[920px]:justify-end">
            <span className="inline-flex min-h-9 items-center gap-2 rounded-[7px] border border-info/22 bg-info-surface px-3 text-sm font-bold text-info-strong">
              <CalendarDays aria-hidden="true" className="size-4" />
              UTC daily reset
            </span>
            {currentUserRank ? (
              <span className="inline-flex min-h-9 items-center gap-2 rounded-[7px] border border-success/28 bg-success-soft px-3 text-sm font-bold text-success-strong">
                <Trophy aria-hidden="true" className="size-4" />
                Your rank: #{currentUserRank}
              </span>
            ) : !session ? (
              <Link
                className="inline-flex min-h-9 items-center justify-center rounded-[7px] border border-primary bg-primary px-3 text-sm font-bold text-primary-contrast"
                href={routes.login}
              >
                Log in to rank
              </Link>
            ) : null}
          </div>
        </div>

        {loadError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
            {loadError}
          </div>
        ) : null}

        <DailyChallengeRankingsSummary
          challengeDate={challengeDate}
          currentUserId={session?.id}
          initialScores={scores}
        />
      </section>
    </>
  );
}
