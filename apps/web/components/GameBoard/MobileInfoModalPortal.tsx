'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export const INFO_MODAL_TRANSITION_MS = 180;

export function MobileInfoModalPortal({
  children,
  isOpen,
  onClose,
}: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isEntered, setIsEntered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsMounted(true), 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isMounted || !isOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => setIsEntered(true));

    return () => window.cancelAnimationFrame(frame);
  }, [isMounted, isOpen]);

  if (!isMounted) {
    return null;
  }

  const isVisible = isOpen && isEntered;

  return createPortal(
    <div
      className={[
        'fixed inset-0 z-50 hidden items-center justify-center bg-black/75 p-3 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none max-[900px]:flex',
        isVisible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <button
        aria-label="Close run details"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        className={[
          'relative z-10 w-full max-w-lg transform transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none',
          isVisible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-1 scale-[0.98] opacity-0',
        ].join(' ')}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
