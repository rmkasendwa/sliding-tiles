'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useBoardFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const frameRef = useRef<HTMLElement>(null);

  const exit = useCallback(async () => {
    if (document.fullscreenElement === frameRef.current) {
      await document.exitFullscreen();
      return;
    }

    setIsFullscreen(false);
  }, []);

  const toggle = useCallback(async () => {
    const boardFrame = frameRef.current;
    if (!boardFrame) {
      return;
    }

    if (isFullscreen) {
      await exit();
      return;
    }

    setIsFullscreen(true);

    if (document.fullscreenEnabled && boardFrame.requestFullscreen) {
      try {
        await boardFrame.requestFullscreen();
      } catch {
        setIsFullscreen(true);
      }
    }
  }, [exit, isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement === frameRef.current) {
        setIsFullscreen(true);
        return;
      }

      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  return {
    exit,
    frameRef,
    isFullscreen,
    toggle,
  };
}
