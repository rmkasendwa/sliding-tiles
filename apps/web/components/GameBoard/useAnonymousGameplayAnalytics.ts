'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

import {
  hasStorageConsent,
  subscribeToStorageConsent,
} from '@/lib/storageConsent';

const ANONYMOUS_PLAYER_ID_KEY = 'sliding-tiles:anonymous-player-id';
const ANALYTICS_ENDPOINT = '/api/analytics';
const BATCH_SIZE = 10;
const FLUSH_DELAY_MS = 2_000;

export type AnonymousGameplayEventName =
  | 'autoplay_completed'
  | 'autoplay_started'
  | 'auto_play_completed'
  | 'auto_play_started'
  | 'game_abandoned'
  | 'game_completed'
  | 'game_started'
  | 'invalid_move'
  | 'landing_page_view'
  | 'leaderboard_opened'
  | 'leaderboard_viewed'
  | 'level_unlocked'
  | 'login_completed'
  | 'peek_image_clicked'
  | 'peek_image_used'
  | 'profile_viewed'
  | 'reset_clicked'
  | 'runs_history_viewed'
  | 'session_ended'
  | 'session_started'
  | 'share_clicked'
  | 'shuffle_clicked'
  | 'signup_clicked'
  | 'signup_completed'
  | 'signup_prompt_shown'
  | 'signup_started'
  | 'solver_cache_hit'
  | 'solver_cache_miss'
  | 'solver_requested'
  | 'timer_paused'
  | 'timer_resumed'
  | 'tile_dragged';

export type AnonymousGameplayMetadata = {
  level?: number;
  metadata?: Record<string, unknown>;
  moveCount?: number;
  puzzleSize?: string;
  timerValueMs?: number;
};

type QueuedAnalyticsEvent = AnonymousGameplayMetadata & {
  anonymousId: string;
  eventName: AnonymousGameplayEventName;
  pathname?: string;
  referrer?: string;
  screenHeight?: number;
  screenWidth?: number;
  sessionId: string;
  timestamp: string;
  userAgent?: string;
};

let inMemoryAnonymousId: string | null = null;
let inMemorySessionId: string | null = null;

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

export function getCurrentAnalyticsIdentity(options?: {
  allowEphemeral?: boolean;
}) {
  try {
    if (hasStorageConsent()) {
      return { anonymousId: getOrCreatePlayerId() };
    }

    if (options?.allowEphemeral) {
      inMemoryAnonymousId ??= createId();
      return { anonymousId: inMemoryAnonymousId };
    }
  } catch {
    // Analytics identity lookup should never block the primary action.
  }

  return null;
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

export function trackAnalyticsEvent(
  eventName: AnonymousGameplayEventName,
  metadata: AnonymousGameplayMetadata = {},
  options?: { allowEphemeral?: boolean; immediate?: boolean },
) {
  try {
    const identity = getCurrentAnalyticsIdentity({
      allowEphemeral: options?.allowEphemeral,
    });
    if (!identity) {
      return;
    }

    inMemorySessionId ??= createId();
    postEvents(
      [
        {
          ...metadata,
          anonymousId: identity.anonymousId,
          eventName,
          pathname: window.location.pathname,
          referrer: document.referrer || undefined,
          screenHeight: window.screen.height,
          screenWidth: window.screen.width,
          sessionId: inMemorySessionId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent.slice(0, 512),
        },
      ],
      options?.immediate,
    );
  } catch {
    // Analytics must never interfere with the primary interaction.
  }
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
      if (!isSignedIn && !hasConsent) {
        return;
      }

      try {
        playerIdRef.current ??=
          getCurrentAnalyticsIdentity({ allowEphemeral: isSignedIn })
            ?.anonymousId ?? null;
        if (!playerIdRef.current) {
          return;
        }

        sessionIdRef.current ??= createId();

        const event: QueuedAnalyticsEvent = {
          ...metadata,
          anonymousId: playerIdRef.current,
          eventName,
          pathname: window.location.pathname,
          referrer: document.referrer || undefined,
          screenHeight: window.screen.height,
          screenWidth: window.screen.width,
          sessionId: sessionIdRef.current,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent.slice(0, 512),
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
