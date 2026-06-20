'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

import {
  hasStorageConsent,
  subscribeToStorageConsent,
} from '@/lib/storageConsent';

const ANONYMOUS_PLAYER_ID_KEY = 'sliding-tiles:anonymous-player-id';
const ANALYTICS_ENDPOINT = '/api/anonymous-analytics';
const BATCH_SIZE = 10;
const FLUSH_DELAY_MS = 2_000;

export type AnonymousGameplayEventName =
  | 'auto_play_completed'
  | 'auto_play_started'
  | 'game_abandoned'
  | 'game_completed'
  | 'game_started'
  | 'invalid_move'
  | 'leaderboard_opened'
  | 'level_unlocked'
  | 'peek_image_clicked'
  | 'reset_clicked'
  | 'signup_clicked'
  | 'signup_prompt_shown'
  | 'tile_dragged'
  | 'timer_paused'
  | 'timer_resumed';

export type AnonymousGameplayMetadata = {
  level?: number;
  moveCount?: number;
  puzzleSize?: string;
  timerValueMs?: number;
};

type QueuedAnalyticsEvent = AnonymousGameplayMetadata & {
  anonymousPlayerId: string;
  eventName: AnonymousGameplayEventName;
  screenHeight?: number;
  screenWidth?: number;
  sessionId: string;
  timestamp: string;
};

function createId() {
  return window.crypto.randomUUID();
}

function getOrCreatePlayerId() {
  const storedId = window.localStorage.getItem(ANONYMOUS_PLAYER_ID_KEY);
  if (storedId) {
    return storedId;
  }

  const playerId = createId();
  window.localStorage.setItem(ANONYMOUS_PLAYER_ID_KEY, playerId);
  return playerId;
}

function postEvents(events: QueuedAnalyticsEvent[], useBeacon = false) {
  if (events.length === 0) {
    return;
  }

  const body = JSON.stringify({ events });
  if (
    useBeacon &&
    navigator.sendBeacon?.(
      ANALYTICS_ENDPOINT,
      new Blob([body], { type: 'application/json' }),
    )
  ) {
    return;
  }

  void fetch(ANALYTICS_ENDPOINT, {
    body,
    headers: { 'Content-Type': 'application/json' },
    keepalive: useBeacon,
    method: 'POST',
  }).catch(() => undefined);
}

export function useAnonymousGameplayAnalytics(isSignedIn: boolean) {
  const hasConsent = useSyncExternalStore(
    subscribeToStorageConsent,
    hasStorageConsent,
    () => false,
  );
  const queueRef = useRef<QueuedAnalyticsEvent[]>([]);
  const flushTimeoutRef = useRef<number | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const flush = useCallback((useBeacon = false) => {
    if (flushTimeoutRef.current !== null) {
      window.clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }

    const events = queueRef.current.splice(0, BATCH_SIZE);
    postEvents(events, useBeacon);

    if (queueRef.current.length > 0) {
      postEvents(queueRef.current.splice(0), useBeacon);
    }
  }, []);

  const track = useCallback(
    (
      eventName: AnonymousGameplayEventName,
      metadata: AnonymousGameplayMetadata = {},
      options?: { immediate?: boolean },
    ) => {
      if (isSignedIn || !hasConsent) {
        return;
      }

      try {
        playerIdRef.current ??= getOrCreatePlayerId();
        sessionIdRef.current ??= createId();

        const event: QueuedAnalyticsEvent = {
          ...metadata,
          anonymousPlayerId: playerIdRef.current,
          eventName,
          screenHeight: window.screen.height,
          screenWidth: window.screen.width,
          sessionId: sessionIdRef.current,
          timestamp: new Date().toISOString(),
        };

        if (options?.immediate) {
          flush(true);
          postEvents([event], true);
          return;
        }

        queueRef.current.push(event);
        if (queueRef.current.length >= BATCH_SIZE) {
          flush();
          return;
        }

        if (flushTimeoutRef.current === null) {
          flushTimeoutRef.current = window.setTimeout(
            () => flush(),
            FLUSH_DELAY_MS,
          );
        }
      } catch {
        // Analytics must never interfere with the game.
      }
    },
    [flush, hasConsent, isSignedIn],
  );

  useEffect(() => {
    const flushOnPageExit = () => flush(true);
    window.addEventListener('pagehide', flushOnPageExit);

    return () => {
      window.removeEventListener('pagehide', flushOnPageExit);
      flush(true);
    };
  }, [flush]);

  return { track };
}
