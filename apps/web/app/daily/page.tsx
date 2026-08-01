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

  return (
    <section className="page-rail-wide mx-auto grid gap-5 py-4">
      <div className="grid gap-3 rounded-lg border border-accent/18 bg-panel p-4 shadow-panel min-[860px]:grid-cols-[minmax(0,1fr)_auto] min-[860px]:items-center">
        <div className="grid gap-1">
          <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
            Daily challenge
          </p>
          <h1 className="text-[clamp(2rem,5vw,3.5rem)] leading-none">
            {formatChallengeDate(challengeDate)}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted">
            Everyone gets this same board today. Your first successful
            submission is final.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 min-[860px]:justify-end">
          <span className="inline-flex min-h-9 items-center gap-2 rounded-[7px] border border-info/22 bg-info-surface px-3 text-sm font-bold text-info-strong">
            <CalendarDays aria-hidden="true" className="size-4" />
            UTC daily reset
          </span>
          {currentUserRank ? (
            <span className="inline-flex min-h-9 items-center gap-2 rounded-[7px] border border-success/28 bg-success-soft px-3 text-sm font-bold text-success-strong">
              <Trophy aria-hidden="true" className="size-4" />
              Your rank: #{currentUserRank}
            </span>
          ) : null}
        </div>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
          {loadError}
        </div>
      ) : null}

      {submittedScore ? (
        <section className="grid min-h-96 place-items-center rounded-lg border border-success/28 bg-[linear-gradient(160deg,var(--color-success-soft),var(--color-surface)_58%,var(--color-info-surface))] p-6 text-center shadow-panel">
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
        <GameBoard
          dailyChallenge={{ challengeDate }}
          initialBoard={initialBoard}
          initialHighestReachedLevel={initialBoard.level}
          isSignedIn={Boolean(session)}
          playerAvatarUrl={session?.avatarUrl}
          playerName={session?.name}
        />
      )}

      <section className="grid gap-3 rounded-lg border border-accent/16 bg-panel p-4 shadow-panel">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.76rem] font-extrabold uppercase text-accent-strong">
              Today&apos;s rankings
            </p>
            <h2 className="mt-1 text-2xl leading-tight">Leaderboard</h2>
          </div>
          {!session ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-primary bg-primary px-4 text-sm font-bold text-primary-contrast"
              href={routes.login}
            >
              Log in to rank
            </Link>
          ) : null}
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
  );
}
