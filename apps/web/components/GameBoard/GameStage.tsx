'use client';

import type { MutableRefObject, PointerEventHandler, RefObject } from 'react';

import { BoardState, Slot, slotKey } from '@/lib/board';

import { BoardTile } from './BoardTile';
import { BOARD_SIZE, BOARD_SURFACE_BACKGROUND } from './constants';
import { CompletionEffects } from './CompletionEffects';
import { GameHud } from './GameHud';
import { GameToolbar } from './GameToolbar';
import { ReplayResultPanel, type ReplayResult } from './ReplayResultPanel';

type GameStageProps = {
  board: BoardState;
  boardEntryAnimationKey: number;
  boardFrameRef: RefObject<HTMLElement | null>;
  columns: number;
  confettiBurstKey: number | null;
  continueLevel: number;
  elapsedTimeLabel: string;
  hintedSlot: string | null;
  isBoardEntering: boolean;
  isBoardFullscreen: boolean;
  isCelebrating: boolean;
  isCompletionImageVisible: boolean;
  isFocusPaused: boolean;
  isMuted: boolean;
  isResetting: boolean;
  isShowingHintPlaceholder: boolean;
  isShowingSolvedHint: boolean;
  isShuffleAnimationRunning: boolean;
  isSoundEnabled: boolean;
  movableSlotKeys: ReadonlySet<string>;
  onBoardPointerDown: PointerEventHandler<HTMLDivElement>;
  onBoardPointerLeave: PointerEventHandler<HTMLDivElement>;
  onBoardPointerUp: PointerEventHandler<HTMLDivElement>;
  onContinueReplay: () => void;
  onHint: (slot: string | null) => void;
  onInvalidMove: () => void;
  onMove: (slot: Slot) => void;
  onOpenDetails: () => void;
  onPeekCancel: PointerEventHandler<HTMLButtonElement>;
  onPeekDown: PointerEventHandler<HTMLButtonElement>;
  onPeekLeave: PointerEventHandler<HTMLButtonElement>;
  onPeekUp: PointerEventHandler<HTMLButtonElement>;
  onReset: () => void;
  onReplayAgain: () => void;
  onShuffle: () => void;
  onToggleFullscreen: () => void;
  onToggleMuted: () => void;
  replayResult: ReplayResult | null;
  rows: number;
  suppressNextClickRef: MutableRefObject<boolean>;
  tileRotationSeed: number;
};

export function GameStage({
  board,
  boardEntryAnimationKey,
  boardFrameRef,
  columns,
  confettiBurstKey,
  continueLevel,
  elapsedTimeLabel,
  hintedSlot,
  isBoardEntering,
  isBoardFullscreen,
  isCelebrating,
  isCompletionImageVisible,
  isFocusPaused,
  isMuted,
  isResetting,
  isShowingHintPlaceholder,
  isShowingSolvedHint,
  isShuffleAnimationRunning,
  isSoundEnabled,
  movableSlotKeys,
  onBoardPointerDown,
  onBoardPointerLeave,
  onBoardPointerUp,
  onContinueReplay,
  onHint,
  onInvalidMove,
  onMove,
  onOpenDetails,
  onPeekCancel,
  onPeekDown,
  onPeekLeave,
  onPeekUp,
  onReset,
  onReplayAgain,
  onShuffle,
  onToggleFullscreen,
  onToggleMuted,
  replayResult,
  rows,
  suppressNextClickRef,
  tileRotationSeed,
}: GameStageProps) {
  const tileWidth = BOARD_SIZE / columns;
  const tileHeight = BOARD_SIZE / rows;

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
        onOpenDetails={onOpenDetails}
        rows={rows}
        variant={isBoardFullscreen ? 'fullscreen' : 'compact'}
      />
      <div
        className={[
          'relative aspect-square overflow-hidden rounded-lg',
          isBoardFullscreen
            ? 'fullscreen-board-shell'
            : 'w-[min(100%,calc(100svh-64px))]',
        ].join(' ')}
        onPointerDown={onBoardPointerDown}
        onPointerLeave={onBoardPointerLeave}
        onPointerUp={onBoardPointerUp}
        style={{
          background: BOARD_SURFACE_BACKGROUND,
          touchAction: 'none',
        }}
      >
        {board.tileGrid.flat().map((tile) => {
          if (tile.type === 'PLACEHOLDER' && !isShowingSolvedHint) {
            return null;
          }

          return (
            <BoardTile
              columns={columns}
              emptySlot={board.emptySlot}
              hintedSlot={hintedSlot}
              isHintPlaceholderVisible={isShowingHintPlaceholder}
              isEntering={isBoardEntering}
              isMovable={movableSlotKeys.has(slotKey(tile.slot))}
              isResetting={isResetting}
              isShowingSolvedHint={isShowingSolvedHint}
              key={`${boardEntryAnimationKey}:${tile.position}`}
              onHint={tile.type === 'PLACEHOLDER' ? () => undefined : onHint}
              onInvalidMove={onInvalidMove}
              onMove={onMove}
              rows={rows}
              suppressNextClickRef={suppressNextClickRef}
              tile={tile}
              tileHeight={tileHeight}
              tileRotationSeed={tileRotationSeed}
              tileWidth={tileWidth}
            />
          );
        })}
        <CompletionEffects
          confettiBurstKey={confettiBurstKey}
          isCelebrating={isCelebrating}
          isCompletionImageVisible={isCompletionImageVisible}
        />
      </div>
      <GameToolbar
        columns={columns}
        elapsedTimeLabel={elapsedTimeLabel}
        isBoardFullscreen={isBoardFullscreen}
        isCelebrating={isCelebrating}
        isFocusPaused={isFocusPaused}
        isMuted={isMuted}
        isShuffleAnimationRunning={isShuffleAnimationRunning}
        isSoundEnabled={isSoundEnabled}
        level={board.level}
        moves={board.moves}
        onPeekCancel={onPeekCancel}
        onPeekDown={onPeekDown}
        onPeekLeave={onPeekLeave}
        onPeekUp={onPeekUp}
        onReset={onReset}
        onShuffle={onShuffle}
        onToggleFullscreen={onToggleFullscreen}
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
    </section>
  );
}
