'use client';

import { useEffect, type ReactNode } from 'react';

import {
  isThemePreference,
  resolveThemePreference,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/lib/theme';

type ThemeProviderProps = {
  children: ReactNode;
};

function getStoredThemePreference(): ThemePreference {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(storedTheme) ? storedTheme : 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(preference: ThemePreference) {
  const systemPrefersDark = window.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches;
  const resolvedTheme = resolveThemePreference(preference, systemPrefersDark);
  const root = document.documentElement;

  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const syncTheme = () => applyTheme(getStoredThemePreference());

    syncTheme();
    mediaQuery.addEventListener('change', syncTheme);
    window.addEventListener('storage', syncTheme);
    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);

    return () => {
      mediaQuery.removeEventListener('change', syncTheme);
      window.removeEventListener('storage', syncTheme);
      window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
    };
  }, []);

  return children;
}
