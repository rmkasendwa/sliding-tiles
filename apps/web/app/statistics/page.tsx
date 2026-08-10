import { redirect } from 'next/navigation';
import {
  Activity,
  Flame,
  History,
  type LucideIcon,
  Move,
  Repeat2,
  Timer,
  Trophy,
} from 'lucide-react';

import { type ApiUserStatistics, apiRequest } from '@/lib/api';
import { getLoginUrl } from '@/lib/authRedirect';
import { pageMetadata } from '@/lib/metadata';
import { routes } from '@/lib/routes';
import { getSession } from '@/lib/session';

export const metadata = pageMetadata.statistics;

type TrendPoint = ApiUserStatistics['trend'][number];

function formatInteger(value: number) {
  return new Intl.NumberFormat('en').format(value);
}

function formatAverage(value: number | null, suffix = '') {
  if (value === null) {
    return 'No data';
  }

  return `${new Intl.NumberFormat('en', {
    maximumFractionDigits: value >= 10 ? 0 : 1,
  }).format(value)}${suffix}`;
}

function formatDuration(totalSeconds: number | null) {
  if (totalSeconds === null) {
    return 'No data';
  }

  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(isoDate));
}

function formatBestRun(
  run: ApiUserStatistics['bests']['moves'] | ApiUserStatistics['bests']['time'],
  metric: 'moves' | 'time',
) {
  if (!run) {
    return 'No completed runs yet';
  }

  const value = metric === 'moves' ? `${run.moves} moves` : formatDuration(run.timeSeconds);

  return `${value} on level ${run.level}`;
}

function StatCard({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail?: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <article className="grid gap-3 rounded-[8px] border border-line bg-panel p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-muted">{label}</p>
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-accent/10 text-accent-strong">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <strong className="text-[clamp(1.75rem,5vw,2.75rem)] leading-none">
        {value}
      </strong>
      {detail ? <p className="text-sm text-muted">{detail}</p> : null}
    </article>
  );
}

function TrendChart({
  label,
  points,
  valueKey,
  valueLabel,
}: {
  label: string;
  points: TrendPoint[];
  valueKey: 'moves' | 'timeSeconds';
  valueLabel: string;
}) {
  const values = points.map((point) => point[valueKey]);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 0;
  const range = Math.max(maxValue - minValue, 1);
  const chartWidth = 640;
  const chartHeight = 220;
  const paddingX = 34;
  const paddingY = 28;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingY * 2;
  const coordinates = points.map((point, index) => {
    const x =
      points.length === 1
        ? chartWidth / 2
        : paddingX + (index / (points.length - 1)) * plotWidth;
    const y =
      paddingY +
      ((maxValue - point[valueKey]) / range) * plotHeight;

    return { point, x, y };
  });
  const path = coordinates
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ');
  const areaPath =
    coordinates.length > 0
      ? `${path} L ${coordinates.at(-1)?.x} ${chartHeight - paddingY} L ${coordinates[0].x} ${chartHeight - paddingY} Z`
      : '';

  return (
    <article className="grid gap-4 rounded-[8px] border border-line bg-panel p-4 shadow-panel">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase text-accent-strong">
            {valueLabel}
          </p>
          <h2 className="text-xl leading-tight">{label}</h2>
        </div>
        <p className="text-sm text-muted">
          Lower is better across the latest {points.length} runs
        </p>
      </div>

      {coordinates.length > 0 ? (
        <div className="overflow-hidden rounded-[8px] border border-line bg-background">
          <svg
            aria-label={label}
            className="h-64 w-full"
            preserveAspectRatio="none"
            role="img"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          >
            <defs>
              <linearGradient
                id={`${valueKey}-trend-fill`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g className="text-line">
              {[0, 1, 2].map((line) => {
                const y = paddingY + (line / 2) * plotHeight;

                return (
                  <line
                    key={line}
                    stroke="currentColor"
                    strokeWidth="1"
                    x1={paddingX}
                    x2={chartWidth - paddingX}
                    y1={y}
                    y2={y}
                  />
                );
              })}
            </g>
            {areaPath ? (
              <path
                className="text-accent"
                d={areaPath}
                fill={`url(#${valueKey}-trend-fill)`}
              />
            ) : null}
            <path
              className="text-accent-strong"
              d={path}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="5"
              vectorEffect="non-scaling-stroke"
            />
            {coordinates.map(({ point, x, y }) => (
              <g key={point.id}>
                <circle
                  className="text-background"
                  cx={x}
                  cy={y}
                  fill="currentColor"
                  r="8"
                />
                <circle
                  className="text-accent-strong"
                  cx={x}
                  cy={y}
                  fill="currentColor"
                  r="5"
                />
              </g>
            ))}
          </svg>
          <div className="grid grid-cols-2 gap-3 border-t border-line p-3 text-sm text-muted sm:grid-cols-4">
            {points.slice(-4).map((point) => (
              <div key={point.id} className="min-w-0">
                <p className="truncate font-bold text-foreground">
                  #{point.completionNumber} - Level {point.level}
                </p>
                <p>
                  {valueKey === 'moves'
                    ? `${point.moves} moves`
                    : formatDuration(point.timeSeconds)}
                  {' - '}
                  {formatDate(point.completedAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid min-h-64 place-items-center rounded-[8px] border border-dashed border-line bg-background p-6 text-center text-muted">
          Complete a level to start drawing this chart.
        </div>
      )}
    </article>
  );
}

export default async function StatisticsPage() {
  const session = await getSession();
  if (!session) {
    redirect(getLoginUrl(routes.statistics));
  }

  const statistics = await apiRequest<ApiUserStatistics>(
    '/leaderboard/mine/statistics',
  );
  const hasRuns = statistics.counts.totalRuns > 0;

  return (
    <section className="page-rail mx-auto grid max-w-300 gap-5 py-5">
      <header className="grid gap-2 border-b border-line pb-4">
        <p className="text-xs font-extrabold uppercase text-accent-strong">
          Player progress
        </p>
        <h1 className="text-[clamp(2rem,6vw,3.6rem)] leading-tight">
          Statistics
        </h1>
        <p className="max-w-2xl text-muted">
          Track completed levels, total effort, personal bests, replays, streaks,
          and the recent shape of your solves.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail={`${formatInteger(statistics.counts.totalRuns)} completed runs recorded`}
          icon={Trophy}
          label="Levels completed"
          value={formatInteger(statistics.counts.levelsCompleted)}
        />
        <StatCard
          detail="Across original and replay completions"
          icon={Move}
          label="Total moves made"
          value={formatInteger(statistics.totals.moves)}
        />
        <StatCard
          detail="Total elapsed play time from completed runs"
          icon={Timer}
          label="Total play time"
          value={formatDuration(statistics.totals.playTimeSeconds)}
        />
        <StatCard
          detail="Consecutive local days with a completion"
          icon={Flame}
          label="Current streak"
          value={`${statistics.streak.currentStreak} day${statistics.streak.currentStreak === 1 ? '' : 's'}`}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail={hasRuns ? 'Mean active completion time' : undefined}
          icon={Activity}
          label="Average completion time"
          value={formatDuration(statistics.averages.timeSeconds)}
        />
        <StatCard
          detail={hasRuns ? 'Mean moves per completed run' : undefined}
          icon={Move}
          label="Average move count"
          value={formatAverage(statistics.averages.moves)}
        />
        <StatCard
          detail={formatBestRun(statistics.bests.time, 'time')}
          icon={Timer}
          label="Best completion time"
          value={statistics.bests.time ? formatDuration(statistics.bests.time.timeSeconds) : 'No data'}
        />
        <StatCard
          detail={formatBestRun(statistics.bests.moves, 'moves')}
          icon={History}
          label="Best move count"
          value={
            statistics.bests.moves
              ? formatInteger(statistics.bests.moves.moves)
              : 'No data'
          }
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <StatCard
          detail="Completed attempts replaying a saved puzzle setup"
          icon={Repeat2}
          label="Replay count"
          value={formatInteger(statistics.counts.replayCount)}
        />
        <StatCard
          detail={
            statistics.streak.lastCompletionLocalDate
              ? `Last completion: ${statistics.streak.lastCompletionLocalDate}`
              : 'Complete a level to start a streak'
          }
          icon={Flame}
          label="Longest streak"
          value={`${statistics.streak.longestStreak} day${statistics.streak.longestStreak === 1 ? '' : 's'}`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <TrendChart
          label="Completion Time Trend"
          points={statistics.trend}
          valueKey="timeSeconds"
          valueLabel="Speed"
        />
        <TrendChart
          label="Move Count Trend"
          points={statistics.trend}
          valueKey="moves"
          valueLabel="Efficiency"
        />
      </div>
    </section>
  );
}
