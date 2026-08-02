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

export function DailyChallengePodium({
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
    <div
      aria-busy={isPending}
      className="grid gap-3 min-[860px]:grid-cols-3"
    >
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
  );
}

export { DAILY_CHALLENGE_SUBMITTED_EVENT };
