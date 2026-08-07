'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';

import { listDailyChallengeRankings } from '@/app/actions/game';
import type { ApiDailyChallengeScore } from '@/lib/api';

import { CurrentUserBadge } from './CurrentUserBadge';
import { ProfileAvatar } from './ProfileAvatar';

const DAILY_CHALLENGE_SUBMITTED_EVENT =
  'sliding-tiles:daily-challenge-submitted';

type DailyChallengeSubmittedEvent = CustomEvent<{
  challengeDate: string;
}>;

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getAverageMoves(scores: ApiDailyChallengeScore[]) {
  return scores.length > 0
    ? Math.round(
        scores.reduce((total, score) => total + score.moves, 0) /
          scores.length,
      )
    : null;
}

export function DailyChallengeRankingsSummary({
  challengeDate,
  currentUserId,
  initialScores,
}: {
  challengeDate: string;
  currentUserId?: string | null;
  initialScores: ApiDailyChallengeScore[];
}) {
  const [scores, setScores] = useState(initialScores);
  const [isPending, startTransition] = useTransition();
  const fastestScore = scores[0] ?? null;
  const averageMoves = getAverageMoves(scores);
  const podium = scores.slice(0, 3);
  const placeholders = useMemo(
    () =>
      Array.from(
        { length: Math.max(0, 3 - podium.length) },
        (_, index) => podium.length + index + 1,
      ),
    [podium.length],
  );

  useEffect(() => {
    const refreshPodium = (event: Event) => {
      const submittedEvent = event as DailyChallengeSubmittedEvent;

      if (submittedEvent.detail.challengeDate !== challengeDate) {
        return;
      }

      startTransition(async () => {
        const nextScores = await listDailyChallengeRankings({
          challengeDate,
        });
        setScores(nextScores);
      });
    };

    window.addEventListener(DAILY_CHALLENGE_SUBMITTED_EVENT, refreshPodium);

    return () => {
      window.removeEventListener(
        DAILY_CHALLENGE_SUBMITTED_EVENT,
        refreshPodium,
      );
    };
  }, [challengeDate]);

  return (
    <div aria-busy={isPending} className="grid gap-5">
      <div className="grid gap-3 min-[760px]:grid-cols-3">
        <article className="rounded-lg border border-accent/18 bg-primary-soft p-4 shadow-card-soft">
          <p className="text-[0.72rem] font-extrabold uppercase text-accent-strong">
            Posted scores
          </p>
          <p className="mt-1 text-3xl font-bold">{scores.length}</p>
        </article>
        <article className="rounded-lg border border-info/22 bg-info-surface p-4 shadow-card-soft">
          <p className="text-[0.72rem] font-extrabold uppercase text-info-strong">
            Fastest active
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

      <div className="grid gap-3 min-[860px]:grid-cols-3">
        {podium.map((score, index) => {
          const playerName = score.user?.name ?? 'Player';
          const rank = index + 1;
          const isCurrentUser = currentUserId === score.userId;

          return (
            <article
              className={[
                'rounded-lg border p-4 shadow-panel transition-colors',
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
                  Active {formatDuration(score.timeSeconds)}
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
              <p className="mt-3 text-sm text-muted">{score.moves} moves</p>
            </article>
          );
        })}
        {placeholders.map((rank) => (
          <article
            aria-label={`Rank ${rank} is open`}
            className="grid min-h-36 content-between rounded-lg border border-dashed border-line bg-surface/35 p-4 text-muted shadow-card-soft"
            key={`open-rank-${rank}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.78rem] font-extrabold uppercase">
                #{rank}
              </span>
              <span className="text-xs font-bold">--:--</span>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground/70">Open spot</p>
              <p className="mt-1 text-sm">Complete today&apos;s puzzle.</p>
            </div>
          </article>
        ))}
      </div>

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
                    Active time
                  </th>
                  <th className="border-b border-line p-3 text-left text-xs uppercase text-muted">
                    Total time
                  </th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score, index) => {
                  const isCurrentUser = currentUserId === score.userId;
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
                      <td className="border-b border-line p-3">
                        {formatDuration(
                          score.totalTimeSeconds ?? score.timeSeconds,
                        )}
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
    </div>
  );
}

export { DAILY_CHALLENGE_SUBMITTED_EVENT };
