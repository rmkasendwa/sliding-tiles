'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react';

import {
  BOARD_HINT_DELAY_MS,
  BOARD_HINT_TILE_REVEAL_DELAY_MS,
} from './constants';

const PEEK_BUTTON_PREVIEW_DELAY_MS = 120;

type BoardPreviewOptions = {
  isInteractionBlocked: boolean;
  onFullImagePeeked?: () => void;
  playHintSound: () => void;
};

export function useBoardPreview({
  isInteractionBlocked,
  onFullImagePeeked,
  playHintSound,
}: BoardPreviewOptions) {
  const [hintedSlot, setHintedSlot] = useState<string | null>(null);
  const [isShowingSolvedHint, setIsShowingSolvedHint] = useState(false);
  const [isShowingHintPlaceholder, setIsShowingHintPlaceholder] =
    useState(false);
  const previewButtonPointerIdRef = useRef<number | null>(null);
  const previewButtonTimeoutRef = useRef<number | null>(null);
  const boardHintTimeoutRef = useRef<number | null>(null);
  const placeholderRevealTimeoutRef = useRef<number | null>(null);
  const boardHintMouseUpRef = useRef<(() => void) | null>(null);
  const suppressNextClickRef = useRef(false);

  const clear = useCallback(() => {
    if (boardHintTimeoutRef.current !== null) {
      window.clearTimeout(boardHintTimeoutRef.current);
      boardHintTimeoutRef.current = null;
    }
    if (placeholderRevealTimeoutRef.current !== null) {
      window.clearTimeout(placeholderRevealTimeoutRef.current);
      placeholderRevealTimeoutRef.current = null;
    }
    if (previewButtonTimeoutRef.current !== null) {
      window.clearTimeout(previewButtonTimeoutRef.current);
      previewButtonTimeoutRef.current = null;
    }

    previewButtonPointerIdRef.current = null;
    setIsShowingSolvedHint(false);
    setIsShowingHintPlaceholder(false);

    if (boardHintMouseUpRef.current) {
      window.removeEventListener('mouseup', boardHintMouseUpRef.current);
      boardHintMouseUpRef.current = null;
    }
  }, []);

  const showFullImage = useCallback(() => {
    if (isInteractionBlocked) {
      return;
    }

    if (boardHintTimeoutRef.current !== null) {
      window.clearTimeout(boardHintTimeoutRef.current);
      boardHintTimeoutRef.current = null;
    }
    if (placeholderRevealTimeoutRef.current !== null) {
      window.clearTimeout(placeholderRevealTimeoutRef.current);
      placeholderRevealTimeoutRef.current = null;
    }

    suppressNextClickRef.current = true;
    setIsShowingSolvedHint(true);
    setIsShowingHintPlaceholder(true);
    playHintSound();
    onFullImagePeeked?.();
  }, [isInteractionBlocked, onFullImagePeeked, playHintSound]);

  const showSolvedBoard = useCallback(() => {
    clear();
    setHintedSlot(null);
    setIsShowingSolvedHint(true);
    setIsShowingHintPlaceholder(true);
  }, [clear]);

  const startBoardHint = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (
        event.pointerType !== 'mouse' ||
        event.button !== 0 ||
        isInteractionBlocked
      ) {
        return;
      }

      if (boardHintTimeoutRef.current !== null) {
        window.clearTimeout(boardHintTimeoutRef.current);
      }

      boardHintTimeoutRef.current = window.setTimeout(() => {
        suppressNextClickRef.current = true;
        setIsShowingSolvedHint(true);
        playHintSound();
        onFullImagePeeked?.();
        placeholderRevealTimeoutRef.current = window.setTimeout(() => {
          setIsShowingHintPlaceholder(true);
          placeholderRevealTimeoutRef.current = null;
        }, BOARD_HINT_TILE_REVEAL_DELAY_MS);
        boardHintTimeoutRef.current = null;
      }, BOARD_HINT_DELAY_MS);

      if (boardHintMouseUpRef.current) {
        window.removeEventListener('mouseup', boardHintMouseUpRef.current);
      }

      boardHintMouseUpRef.current = clear;
      window.addEventListener('mouseup', clear, { once: true });
    },
    [clear, isInteractionBlocked, onFullImagePeeked, playHintSound],
  );

  const clearFromPointer = useCallback(() => {
    if (!isInteractionBlocked) {
      clear();
    }
  }, [clear, isInteractionBlocked]);

  const startPeekButtonPreview = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || isInteractionBlocked) {
        return;
      }

      previewButtonPointerIdRef.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      if (previewButtonTimeoutRef.current !== null) {
        window.clearTimeout(previewButtonTimeoutRef.current);
      }

      previewButtonTimeoutRef.current = window.setTimeout(() => {
        if (previewButtonPointerIdRef.current === event.pointerId) {
          showFullImage();
        }
        previewButtonTimeoutRef.current = null;
      }, PEEK_BUTTON_PREVIEW_DELAY_MS);
    },
    [isInteractionBlocked, showFullImage],
  );

  const stopPeekButtonPreview = useCallback(
    (event?: PointerEvent<HTMLButtonElement>) => {
      if (
        event &&
        previewButtonPointerIdRef.current !== null &&
        previewButtonPointerIdRef.current !== event.pointerId
      ) {
        return;
      }

      if (event && event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      clear();
    },
    [clear],
  );

  useEffect(
    () => () => {
      if (boardHintTimeoutRef.current !== null) {
        window.clearTimeout(boardHintTimeoutRef.current);
      }
      if (placeholderRevealTimeoutRef.current !== null) {
        window.clearTimeout(placeholderRevealTimeoutRef.current);
      }
      if (previewButtonTimeoutRef.current !== null) {
        window.clearTimeout(previewButtonTimeoutRef.current);
      }
      if (boardHintMouseUpRef.current) {
        window.removeEventListener('mouseup', boardHintMouseUpRef.current);
      }
    },
    [],
  );

  return {
    clear,
    clearFromPointer,
    hintedSlot,
    isShowingHintPlaceholder,
    isShowingSolvedHint,
    setHintedSlot,
    showSolvedBoard,
    startBoardHint,
    startPeekButtonPreview,
    stopPeekButtonPreview,
    suppressNextClickRef,
  };
}
