'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import {
  isThemePreference,
  resolveThemePreference,
  themeOptions,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from '@/lib/theme';

export const themeLabels: Record<ThemePreference, string> = {
  dark: 'Dark',
  light: 'Light',
  system: 'System',
};

export const themeDescriptions: Record<ThemePreference, string> = {
  dark: 'Use the darker interface.',
  light: 'Use the brighter interface.',
  system: 'Follow your device setting.',
};

export const themeIcons = {
  dark: Moon,
  light: Sun,
  system: Monitor,
} as const;

type ThemeSnapshot = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
};

type ThemeControlProps = {
  layout?: 'compact' | 'cards' | 'drawer';
  onSelect?: () => void;
};

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

export function useThemeSnapshot(): ThemeSnapshot {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );
  const [rawPreference, rawResolvedTheme] = snapshot.split(':');

  return {
    preference: isThemePreference(rawPreference) ? rawPreference : 'system',
    resolvedTheme:
      rawResolvedTheme === 'dark' || rawResolvedTheme === 'light'
        ? rawResolvedTheme
        : 'light',
  };
}

export function ThemeControl({
  layout = 'compact',
  onSelect,
}: ThemeControlProps) {
  const { preference, resolvedTheme } = useThemeSnapshot();
  const isCompact = layout === 'compact';
  const isDrawer = layout === 'drawer';

  return (
    <fieldset
      aria-label="Theme preference"
      className={
        isCompact
          ? 'inline-grid rounded-[9px] border border-line bg-panel p-1'
          : 'grid gap-2'
      }
    >
      <legend className="sr-only">Theme preference</legend>
      <div
        className={
          isCompact
            ? 'grid grid-cols-3 gap-1'
            : isDrawer
              ? 'grid gap-2'
              : 'grid gap-2 sm:grid-cols-3'
        }
      >
        {themeOptions.map((theme) => {
          const Icon = themeIcons[theme];
          const isSelected = preference === theme;
          const label = themeLabels[theme];

          if (isCompact) {
            return (
              <label
                className={[
                  'group relative grid size-9 cursor-pointer place-items-center rounded-[7px] border text-muted transition-[border-color,background-color,color,box-shadow]',
                  isSelected
                    ? 'border-primary/50 bg-primary text-primary-contrast shadow-button-primary'
                    : 'border-transparent hover:bg-accent/10 hover:text-accent-strong',
                ].join(' ')}
                key={theme}
                title={`${label} theme`}
              >
                <input
                  checked={isSelected}
                  className="sr-only"
                  name="nav-theme"
                  onChange={() => {
                    setThemePreference(theme);
                    onSelect?.();
                  }}
                  type="radio"
                  value={theme}
                />
                <Icon aria-hidden="true" className="size-4" />
                <span className="sr-only">{label}</span>
              </label>
            );
          }

          return (
            <label
              className={[
                'grid cursor-pointer gap-2 rounded-[9px] border p-3 transition-[border-color,background-color,box-shadow]',
                isSelected
                  ? 'border-primary/60 bg-primary/14 shadow-focus-primary'
                  : 'border-line bg-surface/70 hover:border-accent/35 hover:bg-accent/8',
              ].join(' ')}
              key={theme}
            >
              <span className="flex items-center gap-2">
                <span
                  className={[
                    'grid size-8 place-items-center rounded-[7px] border',
                    isSelected
                      ? 'border-primary/35 bg-primary text-primary-contrast'
                      : 'border-line bg-panel text-accent-strong',
                  ].join(' ')}
                >
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <span className="font-bold text-foreground">{label}</span>
              </span>
              <span className="text-sm leading-5 text-muted">
                {themeDescriptions[theme]}
              </span>
              <input
                checked={isSelected}
                className="sr-only"
                name={isDrawer ? 'drawer-theme' : 'theme'}
                onChange={() => {
                  setThemePreference(theme);
                  onSelect?.();
                }}
                type="radio"
                value={theme}
              />
            </label>
          );
        })}
      </div>
      {isCompact ? (
        <span className="sr-only">
          Active theme: {themeLabels[resolvedTheme]}
          {preference === 'system' ? ' from your system preference' : ''}
        </span>
      ) : null}
    </fieldset>
  );
}
