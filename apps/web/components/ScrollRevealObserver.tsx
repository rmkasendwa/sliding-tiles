'use client';

import { useEffect } from 'react';

type ScrollRevealObserverProps = {
  targetId: string;
};

export function ScrollRevealObserver({ targetId }: ScrollRevealObserverProps) {
  useEffect(() => {
    const container = document.getElementById(targetId);
    if (!container) {
      return;
    }

    const elements = Array.from(
      container.querySelectorAll<HTMLElement>('.scroll-reveal'),
    );

    if (elements.length === 0) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const element = entry.target as HTMLElement;
          element.classList.add('is-visible');
          observer.unobserve(element);
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.14,
      },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [targetId]);

  return null;
}
