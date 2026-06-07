'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { INFO_MODAL_TRANSITION_MS } from './MobileInfoModalPortal';

export function useGameInfoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const transitionTimeoutRef = useRef<number | null>(null);

  const open = useCallback(() => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    setIsRendered(true);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
    }

    setIsOpen(false);
    const transitionMs = window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches
      ? 0
      : INFO_MODAL_TRANSITION_MS;

    transitionTimeoutRef.current = window.setTimeout(() => {
      setIsRendered(false);
      transitionTimeoutRef.current = null;
    }, transitionMs);
  }, []);

  useEffect(() => {
    if (!isRendered) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [close, isRendered]);

  useEffect(
    () => () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    },
    [],
  );

  return {
    close,
    isOpen,
    isRendered,
    open,
  };
}
