'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { routes } from '@/lib/routes';
import { siteConfig } from '@/lib/site';

const COOKIE_CONSENT_STORAGE_KEY = 'sliding-tiles:cookie-consent';
const COOKIE_CONSENT_EVENT = 'sliding-tiles:cookie-consent-changed';

function getStoredConsent() {
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) === 'accepted';
  } catch {
    return false;
  }
}

function subscribeToConsentChanges(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(COOKIE_CONSENT_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(COOKIE_CONSENT_EVENT, onStoreChange);
  };
}

export function CookieConsentBanner() {
  const hasConsent = useSyncExternalStore(
    subscribeToConsentChanges,
    getStoredConsent,
    () => true,
  );

  const acceptConsent = () => {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, 'accepted');
    } finally {
      window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
    }
  };

  if (hasConsent) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-5 sm:pb-5">
      <section
        aria-label="Cookie consent"
        className="pointer-events-auto mx-auto grid max-w-5xl gap-3 rounded-lg border border-line bg-panel/95 p-4 text-foreground shadow-panel backdrop-blur sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
      >
        <div className="grid gap-1.5">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.08em] text-accent-strong">
            Cookie preferences
          </h2>
          <p className="text-sm leading-6 text-muted">
            {siteConfig.name} uses cookies and local storage for
            authentication, preferences, analytics, and site functionality.
          </p>
        </div>
        <div className="flex flex-col gap-2 min-[420px]:flex-row sm:justify-end">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-[7px] border border-line bg-white/45 px-4 text-sm font-bold text-accent-strong transition-colors hover:bg-accent/10"
            href={routes.privacy}
          >
            Learn more
          </Link>
          <button
            className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[7px] border border-accent bg-accent px-4 text-sm font-bold text-white shadow-button-primary transition-colors hover:bg-accent-strong"
            onClick={acceptConsent}
            type="button"
          >
            Accept
          </button>
        </div>
      </section>
    </div>
  );
}
