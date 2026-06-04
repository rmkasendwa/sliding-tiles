'use client';

import { SettingsDisclosure } from './SettingsDisclosure';
import { ThemeControl, themeLabels, useThemeSnapshot } from './ThemeControl';

export function ThemeSettings() {
  const { preference, resolvedTheme } = useThemeSnapshot();

  return (
    <SettingsDisclosure
      badge={themeLabels[resolvedTheme]}
      description="Choose how the app looks on this device."
      title="Theme"
    >
      <div className="grid gap-3">
        <ThemeControl layout="cards" />
        <p className="text-sm text-muted">
          Active theme: <strong>{themeLabels[resolvedTheme]}</strong>
          {preference === 'system' ? ' from your system preference.' : '.'}
        </p>
      </div>
    </SettingsDisclosure>
  );
}
