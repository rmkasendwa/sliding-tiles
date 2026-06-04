'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import {
  isThemePreference,
  resolveThemePreference,
  themeOptions,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/lib/theme';

import { SettingsDisclosure } from './SettingsDisclosure';

const themeLabels: Record<ThemePreference, string> = {
  dark: 'Dark',
  light: 'Light',
  system: 'System',
};

const themeDescriptions: Record<ThemePreference, string> = {
  dark: 'Use the darker interface.',
  light: 'Use the brighter interface.',
  system: 'Follow your device setting.',
};

const themeIcons = {
  dark: Moon,
  light: Sun,
  system: Monitor,
} as const;

function getSnapshot() {
  if (typeof window === 'undefined') {
    return 'system:light';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  const preference = isThemePreference(storedTheme) ? storedTheme : 'system';
  const resolvedTheme = resolveThemePreference(
    preference,
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  return `${preference}:${resolvedTheme}`;
}

function subscribe(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  window.addEventListener('storage', onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  mediaQuery.addEventListener('change', onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    mediaQuery.removeEventListener('change', onStoreChange);
  };
}

function setThemePreference(preference: ThemePreference) {
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function ThemeSettings() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );
  const [rawPreference, rawResolvedTheme] = snapshot.split(':');
  const preference = isThemePreference(rawPreference) ? rawPreference : 'system';
  const resolvedTheme =
    rawResolvedTheme === 'dark' || rawResolvedTheme === 'light'
      ? rawResolvedTheme
      : 'light';

  return (
    <SettingsDisclosure
      badge={themeLabels[resolvedTheme]}
      description="Choose how the app looks on this device."
      title="Theme"
    >
      <div className="grid gap-3">
        <fieldset className="grid gap-2">
          <legend className="sr-only">Theme preference</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {themeOptions.map((theme) => {
              const Icon = themeIcons[theme];
              const isSelected = preference === theme;

              return (
                <label
                  className={[
                    'grid cursor-pointer gap-2 rounded-[9px] border p-3 transition-[border-color,background-color,box-shadow]',
                    isSelected
                      ? 'border-accent/60 bg-accent/12 shadow-focus-primary'
                      : 'border-line bg-surface/70 hover:border-accent/35 hover:bg-accent/8',
                  ].join(' ')}
                  key={theme}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={[
                        'grid size-8 place-items-center rounded-[7px] border',
                        isSelected
                          ? 'border-accent/35 bg-accent text-primary-contrast'
                          : 'border-line bg-panel text-accent-strong',
                      ].join(' ')}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="font-bold text-foreground">
                      {themeLabels[theme]}
                    </span>
                  </span>
                  <span className="text-sm leading-5 text-muted">
                    {themeDescriptions[theme]}
                  </span>
                  <input
                    checked={isSelected}
                    className="sr-only"
                    name="theme"
                    onChange={() => setThemePreference(theme)}
                    type="radio"
                    value={theme}
                  />
                </label>
              );
            })}
          </div>
        </fieldset>
        <p className="text-sm text-muted">
          Active theme: <strong>{themeLabels[resolvedTheme]}</strong>
          {preference === 'system' ? ' from your system preference.' : '.'}
        </p>
      </div>
    </SettingsDisclosure>
  );
}
