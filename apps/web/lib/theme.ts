export const THEME_STORAGE_KEY = 'sliding-tiles:theme';
export const THEME_CHANGE_EVENT = 'sliding-tiles:theme-changed';

export const themeOptions = ['light', 'dark', 'system'] as const;

export type ThemePreference = (typeof themeOptions)[number];
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export function isThemePreference(value: string | null): value is ThemePreference {
  return (
    value === 'light' ||
    value === 'dark' ||
    value === 'system'
  );
}

export function resolveThemePreference(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }

  return preference;
}

export const themeInitScript = `(() => {
  try {
    const storageKey = '${THEME_STORAGE_KEY}';
    const storedTheme = window.localStorage.getItem(storageKey);
    const preference =
      storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
        ? storedTheme
        : 'system';
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = preference === 'system'
      ? systemPrefersDark ? 'dark' : 'light'
      : preference;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.themePreference = preference;
    root.style.colorScheme = theme;
  } catch {
  }
})();`;
