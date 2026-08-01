import { CalendarDays, Trophy } from 'lucide-react';
import Link from 'next/link';

import { CurrentUserBadge } from '@/components/CurrentUserBadge';
import { GameBoard } from '@/components/GameBoard';
import { ProfileAvatar } from '@/components/ProfileAvatar';
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
  const podium = scores.slice(0, 3);
  const fastestScore = scores[0] ?? null;
  const averageMoves =
    scores.length > 0
      ? Math.round(
          scores.reduce((total, score) => total + score.moves, 0) /
            scores.length,
        )
      : null;

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
            <p className="max-w-md text-sm leading-6 text-muted">
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

        <div className="grid gap-3 min-[760px]:grid-cols-3">
          <article className="rounded-lg border border-accent/18 bg-primary-soft p-4 shadow-card-soft">
            <p className="text-[0.72rem] font-extrabold uppercase text-accent-strong">
              Posted scores
            </p>
            <p className="mt-1 text-3xl font-bold">{scores.length}</p>
          </article>
          <article className="rounded-lg border border-info/22 bg-info-surface p-4 shadow-card-soft">
            <p className="text-[0.72rem] font-extrabold uppercase text-info-strong">
              Fastest time
            </p>
            <p className="mt-1 text-3xl font-bold">
              {fastestScore ? formatDuration(fastestScore.timeSeconds) : '-'}
            </p>
          </article>
          <article className="rounded-lg border border-warning/28 bg-warning-surface p-4 shadow-card-soft">
            <p className="text-[0.72rem] font-extrabold uppercase text-warning-strong">
              Average moves
            </p>
            <p className="mt-1 text-3xl font-bold">
              {averageMoves === null ? '-' : averageMoves}
            </p>
          </article>
        </div>

        {podium.length > 0 ? (
          <div className="grid gap-3 min-[860px]:grid-cols-3">
            {podium.map((score, index) => {
              const playerName = score.user?.name ?? 'Player';
              const rank = index + 1;
              const isCurrentUser = session?.id === score.userId;

              return (
                <article
                  className={[
                    'rounded-lg border p-4 shadow-panel',
                    rank === 1
                      ? 'border-medal-gold-border bg-medal-gold-surface'
                      : rank === 2
                        ? 'border-medal-silver-border bg-medal-silver-surface'
                        : 'border-medal-bronze-border bg-medal-bronze-surface',
                  ].join(' ')}
                  key={score.id}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[0.78rem] font-extrabold uppercase text-muted">
                      #{rank}
                    </span>
                    <span className="text-xs font-bold text-muted">
                      {formatDuration(score.timeSeconds)}
                    </span>
                  </div>
                  <div className="mt-3 flex min-w-0 items-center gap-2">
                    <ProfileAvatar
                      avatarUrl={score.user?.avatarUrl}
                      name={playerName}
                      size={36}
                    />
                    <p className="inline-flex min-w-0 items-center gap-1.5 font-bold">
                      <span className="truncate">{playerName}</span>
                      {isCurrentUser ? <CurrentUserBadge /> : null}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    {score.moves} moves
                  </p>
                </article>
              );
            })}
          </div>
        ) : null}

        <section className="grid gap-3 rounded-lg border border-accent/16 bg-panel p-4 shadow-panel">
          <div>
            <p className="text-[0.76rem] font-extrabold uppercase text-accent-strong">
              Today&apos;s rankings
            </p>
            <h2 className="mt-1 text-2xl leading-tight">Leaderboard</h2>
          </div>

          {scores.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-line">
              <table className="w-full border-collapse">
                <thead className="bg-primary-soft">
                  <tr>
                    <th className="border-b border-line p-3 text-left text-xs uppercase text-muted">
                      Rank
                    </th>
                    <th className="border-b border-line p-3 text-left text-xs uppercase text-muted">
                      Player
                    </th>
                    <th className="border-b border-line p-3 text-left text-xs uppercase text-muted">
                      Moves
                    </th>
                    <th className="border-b border-line p-3 text-left text-xs uppercase text-muted">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((score, index) => {
                    const isCurrentUser = session?.id === score.userId;
                    const playerName = score.user?.name ?? 'Player';

                    return (
                      <tr
                        className={
                          isCurrentUser
                            ? 'bg-accent/12'
                            : index % 2 === 0
                              ? 'bg-surface/40'
                              : 'bg-panel'
                        }
                        key={score.id}
                      >
                        <td className="border-b border-line p-3 font-bold">
                          #{index + 1}
                        </td>
                        <td className="border-b border-line p-3">
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <ProfileAvatar
                              avatarUrl={score.user?.avatarUrl}
                              name={playerName}
                              size={28}
                            />
                            <span className="truncate font-bold">
                              {playerName}
                            </span>
                            {isCurrentUser ? <CurrentUserBadge /> : null}
                          </span>
                        </td>
                        <td className="border-b border-line p-3">
                          {score.moves}
                        </td>
                        <td className="border-b border-line p-3">
                          {formatDuration(score.timeSeconds)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">
              No one has posted today&apos;s challenge yet.
            </p>
          )}
        </section>
      </section>
    </>
  );
}
