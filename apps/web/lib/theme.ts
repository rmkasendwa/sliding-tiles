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

export function setThemePreference(preference: ThemePreference) {
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function getStoredThemePreference(): ThemePreference {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(storedTheme) ? storedTheme : 'system';
  } catch {
    return 'system';
  }
}

export function cycleThemePreference() {
  const preference = getStoredThemePreference();
  const nextPreference: ThemePreference =
    preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light';

  setThemePreference(nextPreference);
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
