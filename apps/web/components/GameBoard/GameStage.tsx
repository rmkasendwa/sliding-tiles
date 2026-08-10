'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject, PointerEventHandler, RefObject } from 'react';
import { BadgeCheck, Flame, Sparkles, Trophy } from 'lucide-react';

import { BoardState, Slot, slotKey } from '@/lib/board';

import { BoardTile } from './BoardTile';
import { AutoPlayResultPanel } from './AutoPlayResultPanel';
import {
  BOARD_SIZE,
  BOARD_SURFACE_BACKGROUND,
  EMPTY_SLOT_HINT_DELAY_MS,
} from './constants';
import { CompletionEffects } from './CompletionEffects';
import { GameHud } from './GameHud';
import { GameToolbar } from './GameToolbar';
import { ReplayResultPanel, type ReplayResult } from './ReplayResultPanel';
import {
  ShareResultCard,
  type ShareResultCardData,
} from './ShareResultCard';

export type PersonalBestNotice = {
  improvementSeconds: number;
  level: number;
};

export type StreakNotice = {
  currentStreak: number;
  longestStreak: number;
  milestone: number | null;
};

export type AchievementNotice = {
  count: number;
  names: string[];
};

type GameStageProps = {
  achievementNotice: AchievementNotice | null;
  board: BoardState;
  boardEntryAnimationKey: number;
  boardFrameRef: RefObject<HTMLElement | null>;
  celebrationMessage?: string;
  columns: number;
  confettiBurstKey: number | null;
  continueLevel: number;
  elapsedTimeLabel: string;
  totalElapsedTimeLabel: string;
  ghostBoard: BoardState | null;
  ghostRun: {
    moves: number;
    timeSeconds: number;
  } | null;
  hintedSlot: string | null;
  imageAspectRatio: number;
  imageUrl: string;
  isBoardEntering: boolean;
  isBoardFullscreen: boolean;
  isCelebrating: boolean;
  isCompletionImageVisible: boolean;
  isFocusPaused: boolean;
  isGhostPlaybackEnabled: boolean;
  isMuted: boolean;
  isAutoPlayActive: boolean;
  isAutoPlayBlocked: boolean;
  isAutoPlayCompletion: boolean;
  isAutoPlaySolving: boolean;
  isAutoPlaySolvedNoticeVisible: boolean;
  autoPlaySpeed: {
    delayMs: number;
    fastestDelayMs: number;
    slowestDelayMs: number;
  };
  autoPlayStats: {
    elapsedMs: number;
    moves: number;
  };
  autoPlayStatusMessage: string | null;
  invalidMoveTile: {
    key: number;
    slotKey: string | null;
  };
  isResetting: boolean;
  isReturningFromSolvedHint: boolean;
  isShowingHintPlaceholder: boolean;
  isShowingSolvedHint: boolean;
  isShuffleAnimationRunning: boolean;
  isSoundEnabled: boolean;
  isImagePickerDisabled?: boolean;
  isShuffleDisabled?: boolean;
  isShareCardOpen: boolean;
  movableSlotKeys: ReadonlySet<string>;
  onAutoPlayToggle: () => void;
  onAutoPlaySpeedChange: (delayMs: number) => void;
  onBoardPointerDown: PointerEventHandler<HTMLDivElement>;
  onBoardPointerLeave: PointerEventHandler<HTMLDivElement>;
  onBoardPointerUp: PointerEventHandler<HTMLDivElement>;
  onContinueReplay: () => void;
  onHint: (slot: string | null) => void;
  onInvalidMove: (slotKey: string) => void;
  onOpenImagePicker: () => void;
  onOpenShareCard: () => void;
  onOpenShortcuts: () => void;
  onMove: (slot: Slot) => void;
  onOpenDetails: () => void;
  onPeekCancel: PointerEventHandler<HTMLButtonElement>;
  onPeekDown: PointerEventHandler<HTMLButtonElement>;
  onPeekLeave: PointerEventHandler<HTMLButtonElement>;
  onPeekUp: PointerEventHandler<HTMLButtonElement>;
  onReset: () => void;
  onReplayAgain: () => void;
  onShuffle: () => void;
  onCloseShareCard: () => void;
  onToggleFullscreen: () => void;
  onToggleGhostPlayback: () => void;
  onToggleMuted: () => void;
  personalBestNotice: PersonalBestNotice | null;
  replayResult: ReplayResult | null;
  rows: number;
  shareCardResult: ShareResultCardData | null;
  streakNotice: StreakNotice | null;
  suppressNextClickRef: MutableRefObject<boolean>;
  tileRotationSeed: number;
};

type BoardTilesLayerProps = Pick<
  GameStageProps,
  | 'board'
  | 'boardEntryAnimationKey'
  | 'columns'
  | 'hintedSlot'
  | 'imageUrl'
  | 'invalidMoveTile'
  | 'isAutoPlayActive'
  | 'isBoardEntering'
  | 'isResetting'
  | 'isReturningFromSolvedHint'
  | 'isShowingHintPlaceholder'
  | 'isShowingSolvedHint'
  | 'movableSlotKeys'
  | 'onHint'
  | 'onInvalidMove'
  | 'onMove'
  | 'rows'
  | 'suppressNextClickRef'
  | 'tileRotationSeed'
> & {
  emptySlotHintTile: string | null;
  onSlotHintEnd: () => void;
  onSlotHintStart: (slot: Slot) => void;
};

const BoardTilesLayer = memo(function BoardTilesLayer({
  board,
  boardEntryAnimationKey,
  columns,
  emptySlotHintTile,
  hintedSlot,
  imageUrl,
  invalidMoveTile,
  isAutoPlayActive,
  isBoardEntering,
  isResetting,
  isReturningFromSolvedHint,
  isShowingHintPlaceholder,
  isShowingSolvedHint,
  movableSlotKeys,
  onHint,
  onInvalidMove,
  onMove,
  onSlotHintEnd,
  onSlotHintStart,
  rows,
  suppressNextClickRef,
  tileRotationSeed,
}: BoardTilesLayerProps) {
  const tileWidth = BOARD_SIZE / columns;
  const tileHeight = BOARD_SIZE / rows;

  return board.tileGrid.flat().map((tile) => {
    if (tile.type === 'PLACEHOLDER' && !isShowingSolvedHint) {
      return null;
    }

    const currentSlotKey = slotKey(tile.slot);

    return (
      <BoardTile
        columns={columns}
        emptySlot={board.emptySlot}
        isEmptySlotHinted={emptySlotHintTile === slotKey(tile.homeSlot)}
        hintedSlot={hintedSlot}
        imageUrl={imageUrl}
        isHintPlaceholderVisible={isShowingHintPlaceholder}
        isEntering={isBoardEntering}
        invalidMoveKey={
          invalidMoveTile.slotKey === currentSlotKey ? invalidMoveTile.key : 0
        }
        isMovable={movableSlotKeys.has(currentSlotKey)}
        isInteractionBlocked={isAutoPlayActive}
        isResetting={isResetting}
        isReturningFromSolvedHint={isReturningFromSolvedHint}
        isShowingSolvedHint={isShowingSolvedHint}
        key={`${boardEntryAnimationKey}:${tile.position}`}
        onHint={onHint}
        onInvalidMove={onInvalidMove}
        onMove={onMove}
        onSlotHintEnd={onSlotHintEnd}
        onSlotHintStart={onSlotHintStart}
        rows={rows}
        suppressNextClickRef={suppressNextClickRef}
        tile={tile}
        tileHeight={tileHeight}
        tileRotationSeed={tileRotationSeed}
        tileWidth={tileWidth}
      />
    );
  });
});

function formatImprovement(seconds: number) {
  return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
}

function PersonalBestBanner({
  notice,
}: {
  notice: PersonalBestNotice;
}) {
  return (
    <div
      className="absolute left-1/2 top-5 z-40 flex w-[min(26rem,calc(100%-2rem))] -translate-x-1/2 items-start gap-3 rounded-lg border border-success/35 bg-panel/95 p-4 text-foreground shadow-panel backdrop-blur"
      role="status"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-success-soft text-success-strong">
        <Trophy aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-success-strong">
          New personal best
        </span>
        <span className="mt-0.5 block text-sm font-bold text-foreground">
          Level {notice.level} improved by{' '}
          {formatImprovement(notice.improvementSeconds)}.
        </span>
      </span>
    </div>
  );
}

function StreakBanner({ notice }: { notice: StreakNotice }) {
  const isMilestone = notice.milestone !== null;

  return (
    <div
      className={[
        'absolute left-1/2 z-40 flex w-[min(26rem,calc(100%-2rem))] -translate-x-1/2 items-start gap-3 rounded-lg border bg-panel/95 p-4 text-foreground shadow-panel backdrop-blur',
        isMilestone
          ? 'top-24 border-celebration/45 animate-[celebration-fade-in_700ms_ease-out_both]'
          : 'top-24 border-warning/35',
      ].join(' ')}
      role="status"
    >
      <span
        className={[
          'grid size-10 shrink-0 place-items-center rounded-md',
          isMilestone
            ? 'bg-celebration/18 text-celebration'
            : 'bg-warning-soft text-warning-strong',
        ].join(' ')}
      >
        {isMilestone ? (
          <Sparkles aria-hidden="true" className="size-5" />
        ) : (
          <Flame aria-hidden="true" className="size-5" />
        )}
      </span>
      <span className="min-w-0">
        <span
          className={[
            'block text-sm font-extrabold',
            isMilestone ? 'text-celebration' : 'text-warning-strong',
          ].join(' ')}
        >
          {isMilestone
            ? `${notice.milestone}-day streak milestone`
            : 'Daily streak updated'}
        </span>
        <span className="mt-0.5 block text-sm font-bold text-foreground">
          Current streak: {notice.currentStreak} day
          {notice.currentStreak === 1 ? '' : 's'} · Longest:{' '}
          {notice.longestStreak} day{notice.longestStreak === 1 ? '' : 's'}
        </span>
      </span>
    </div>
  );
}

function AchievementBanner({ notice }: { notice: AchievementNotice }) {
  const label =
    notice.count === 1
      ? notice.names[0]
      : `${notice.names[0]} + ${notice.count - 1} more`;

  return (
    <div
      className="absolute left-1/2 top-[10.75rem] z-40 flex w-[min(26rem,calc(100%-2rem))] -translate-x-1/2 items-start gap-3 rounded-lg border border-info/35 bg-panel/95 p-4 text-foreground shadow-panel backdrop-blur"
      role="status"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-info-soft text-info-strong">
        <BadgeCheck aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-info-strong">
          Achievement unlocked
        </span>
        <span className="mt-0.5 block text-sm font-bold text-foreground">
          {label}
        </span>
      </span>
    </div>
  );
}

export function GameStage({
  achievementNotice,
  board,
  boardEntryAnimationKey,
  boardFrameRef,
  celebrationMessage,
  columns,
  confettiBurstKey,
  continueLevel,
  elapsedTimeLabel,
  totalElapsedTimeLabel,
  ghostBoard,
  ghostRun,
  hintedSlot,
  imageAspectRatio,
  imageUrl,
  isBoardEntering,
  isBoardFullscreen,
  isCelebrating,
  isCompletionImageVisible,
  isFocusPaused,
  isGhostPlaybackEnabled,
  isMuted,
  isAutoPlayActive,
  isAutoPlayBlocked,
  isAutoPlayCompletion,
  isAutoPlaySolving,
  isAutoPlaySolvedNoticeVisible,
  autoPlaySpeed,
  autoPlayStats,
  autoPlayStatusMessage,
  invalidMoveTile,
  isResetting,
  isReturningFromSolvedHint,
  isShowingHintPlaceholder,
  isShowingSolvedHint,
  isShuffleAnimationRunning,
  isSoundEnabled,
  isImagePickerDisabled = false,
  isShuffleDisabled = false,
  isShareCardOpen,
  movableSlotKeys,
  onAutoPlayToggle,
  onAutoPlaySpeedChange,
  onBoardPointerDown,
  onBoardPointerLeave,
  onBoardPointerUp,
  onContinueReplay,
  onHint,
  onInvalidMove,
  onOpenImagePicker,
  onOpenShareCard,
  onOpenShortcuts,
  onMove,
  onOpenDetails,
  onPeekCancel,
  onPeekDown,
  onPeekLeave,
  onPeekUp,
  onReset,
  onReplayAgain,
  onShuffle,
  onCloseShareCard,
  onToggleFullscreen,
  onToggleGhostPlayback,
  onToggleMuted,
  personalBestNotice,
  replayResult,
  rows,
  shareCardResult,
  streakNotice,
  suppressNextClickRef,
  tileRotationSeed,
}: GameStageProps) {
  const emptySlotHintTimeoutRef = useRef<number | null>(null);
  const [emptySlotHintTile, setEmptySlotHintTile] = useState<string | null>(
    null,
  );
  const clearEmptySlotHint = useCallback(() => {
    if (emptySlotHintTimeoutRef.current !== null) {
      window.clearTimeout(emptySlotHintTimeoutRef.current);
      emptySlotHintTimeoutRef.current = null;
    }
    setEmptySlotHintTile(null);
  }, []);
  const startSlotHint = useCallback((slot: Slot) => {
    if (isShuffleAnimationRunning || isAutoPlayActive) {
      return;
    }

    clearEmptySlotHint();
    const hoveredSlotKey = slotKey(slot);
    const targetTile = board.tileGrid
      .flat()
      .find(
        (tile) =>
          tile.type !== 'PLACEHOLDER' &&
          slotKey(tile.homeSlot) === hoveredSlotKey,
      );

    if (!targetTile) {
      return;
    }

    emptySlotHintTimeoutRef.current = window.setTimeout(() => {
      emptySlotHintTimeoutRef.current = null;
      setEmptySlotHintTile(slotKey(targetTile.homeSlot));
    }, EMPTY_SLOT_HINT_DELAY_MS);
  }, [
    board.tileGrid,
    clearEmptySlotHint,
    isAutoPlayActive,
    isShuffleAnimationRunning,
  ]);

  useEffect(
    () => clearEmptySlotHint,
    [board, clearEmptySlotHint, isShuffleAnimationRunning],
  );

  return (
    <section
      aria-label="Sliding tile board"
      className={[
        'play-board-reveal relative grid min-h-0 place-items-center overflow-hidden bg-night shadow-game-shell',
        isBoardFullscreen
          ? 'fullscreen-board-stage fixed inset-0 z-50 h-screen rounded-none p-4'
          : 'h-[calc(100svh-32px)] rounded-lg p-3 max-[900px]:p-2.5',
      ].join(' ')}
      ref={boardFrameRef}
    >
      <GameHud
        columns={columns}
        imageAspectRatio={imageAspectRatio}
        imageUrl={imageUrl}
        onOpenDetails={onOpenDetails}
        rows={rows}
        variant={isBoardFullscreen ? 'fullscreen' : 'compact'}
      />
      <div
        className={[
          'relative overflow-hidden rounded-lg',
          isBoardFullscreen
            ? 'fullscreen-board-shell'
            : 'w-[min(100%,calc(100svh-64px))]',
        ].join(' ')}
        onPointerDown={isAutoPlayActive ? undefined : onBoardPointerDown}
        onPointerLeave={isAutoPlayActive ? undefined : onBoardPointerLeave}
        onPointerUp={isAutoPlayActive ? undefined : onBoardPointerUp}
        style={{
          aspectRatio: imageAspectRatio,
          background: BOARD_SURFACE_BACKGROUND,
          width: `min(100%, calc((100svh - 64px) * ${imageAspectRatio}))`,
          touchAction: isAutoPlayActive ? 'auto' : 'none',
        }}
      >
        <BoardTilesLayer
          board={board}
          boardEntryAnimationKey={boardEntryAnimationKey}
          columns={columns}
          emptySlotHintTile={emptySlotHintTile}
          hintedSlot={hintedSlot}
          imageUrl={imageUrl}
          invalidMoveTile={invalidMoveTile}
          isAutoPlayActive={isAutoPlayActive}
          isBoardEntering={isBoardEntering}
          isResetting={isResetting}
          isReturningFromSolvedHint={isReturningFromSolvedHint}
          isShowingHintPlaceholder={isShowingHintPlaceholder}
          isShowingSolvedHint={isShowingSolvedHint}
          movableSlotKeys={movableSlotKeys}
          onHint={onHint}
          onInvalidMove={onInvalidMove}
          onMove={onMove}
          onSlotHintEnd={clearEmptySlotHint}
          onSlotHintStart={startSlotHint}
          rows={rows}
          suppressNextClickRef={suppressNextClickRef}
          tileRotationSeed={tileRotationSeed}
        />
        {ghostBoard ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 opacity-45 mix-blend-screen"
          >
            <BoardTilesLayer
              board={ghostBoard}
              boardEntryAnimationKey={0}
              columns={columns}
              emptySlotHintTile={null}
              hintedSlot={null}
              imageUrl={imageUrl}
              invalidMoveTile={{ key: 0, slotKey: null }}
              isAutoPlayActive={true}
              isBoardEntering={false}
              isResetting={false}
              isReturningFromSolvedHint={false}
              isShowingHintPlaceholder={false}
              isShowingSolvedHint={false}
              movableSlotKeys={new Set()}
              onHint={() => undefined}
              onInvalidMove={() => undefined}
              onMove={() => undefined}
              onSlotHintEnd={() => undefined}
              onSlotHintStart={() => undefined}
              rows={rows}
              suppressNextClickRef={suppressNextClickRef}
              tileRotationSeed={tileRotationSeed}
            />
          </div>
        ) : null}
        <div
          aria-hidden="true"
          className="absolute z-6"
          onMouseEnter={() => startSlotHint(board.emptySlot)}
          onMouseLeave={clearEmptySlotHint}
          style={{
            height: `${100 / rows}%`,
            left: `${(board.emptySlot[1] * 100) / columns}%`,
            top: `${(board.emptySlot[0] * 100) / rows}%`,
            width: `${100 / columns}%`,
          }}
        />
        <CompletionEffects
          celebrationMessage={celebrationMessage}
          confettiBurstKey={confettiBurstKey}
          imageUrl={imageUrl}
          isAutoPlayCompletion={isAutoPlayCompletion}
          isCelebrating={isCelebrating}
          isCompletionImageVisible={isCompletionImageVisible}
        />
      </div>
      {personalBestNotice && isCelebrating && !replayResult ? (
        <PersonalBestBanner notice={personalBestNotice} />
      ) : null}
      {streakNotice && isCelebrating && !replayResult ? (
        <StreakBanner notice={streakNotice} />
      ) : null}
      {achievementNotice && isCelebrating && !replayResult ? (
        <AchievementBanner notice={achievementNotice} />
      ) : null}
      <GameToolbar
        columns={columns}
        elapsedTimeLabel={elapsedTimeLabel}
        totalElapsedTimeLabel={totalElapsedTimeLabel}
        ghostRun={ghostRun}
        isBoardFullscreen={isBoardFullscreen}
        isCelebrating={isCelebrating}
        isFocusPaused={isFocusPaused}
        isGhostPlaybackEnabled={isGhostPlaybackEnabled}
        isMuted={isMuted}
        isAutoPlayActive={isAutoPlayActive}
        isAutoPlayBlocked={isAutoPlayBlocked}
        isAutoPlaySolving={isAutoPlaySolving}
        autoPlaySpeed={autoPlaySpeed}
        autoPlayStats={autoPlayStats}
        autoPlayStatusMessage={autoPlayStatusMessage}
        isShuffleAnimationRunning={isShuffleAnimationRunning}
        isSoundEnabled={isSoundEnabled}
        isImagePickerDisabled={isImagePickerDisabled}
        isShuffleDisabled={isShuffleDisabled}
        canOpenShareCard={shareCardResult !== null}
        level={board.level}
        moves={board.moves}
        onAutoPlayToggle={onAutoPlayToggle}
        onAutoPlaySpeedChange={onAutoPlaySpeedChange}
        onOpenImagePicker={onOpenImagePicker}
        onOpenShareCard={onOpenShareCard}
        onOpenShortcuts={onOpenShortcuts}
        onPeekCancel={onPeekCancel}
        onPeekDown={onPeekDown}
        onPeekLeave={onPeekLeave}
        onPeekUp={onPeekUp}
        onReset={onReset}
        onShuffle={onShuffle}
        onToggleFullscreen={onToggleFullscreen}
        onToggleGhostPlayback={onToggleGhostPlayback}
        onToggleMuted={onToggleMuted}
        rows={rows}
      />
      {replayResult ? (
        <ReplayResultPanel
          continueLevel={continueLevel}
          onContinue={onContinueReplay}
          onReplayAgain={onReplayAgain}
          result={replayResult}
        />
      ) : null}
      <ShareResultCard
        isOpen={isShareCardOpen}
        onClose={onCloseShareCard}
        result={shareCardResult}
      />
      {isAutoPlaySolvedNoticeVisible ? (
        <AutoPlayResultPanel
          level={board.level}
          onReset={onReset}
          onShuffle={onShuffle}
        />
      ) : null}
    </section>
  );
}
