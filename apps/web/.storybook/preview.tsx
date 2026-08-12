import { useEffect, type ReactNode } from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';

import '../app/globals.css';

type ThemeMode = 'light' | 'dark' | 'system';

function getResolvedTheme(themeMode: ThemeMode) {
  if (themeMode !== 'system') return themeMode;

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function StorybookThemeProvider({
  children,
  themeMode,
}: {
  children: ReactNode;
  themeMode: ThemeMode;
}) {
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      const resolvedTheme = getResolvedTheme(themeMode);
      root.dataset.theme = resolvedTheme;
      root.dataset.themePreference = themeMode;
      root.style.colorScheme = resolvedTheme;
    };

    applyTheme();

    if (themeMode !== 'system') return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', applyTheme);

    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [themeMode]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {children}
    </div>
  );
}

const withTheme: Decorator = (Story, context) => (
  <StorybookThemeProvider themeMode={context.globals.theme as ThemeMode}>
    <Story />
  </StorybookThemeProvider>
);

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      defaultValue: 'system',
      description: 'Preview theme',
      name: 'Theme',
      toolbar: {
        dynamicTitle: true,
        icon: 'mirror',
        items: [
          { title: 'System', value: 'system' },
          { title: 'Light', value: 'light' },
          { title: 'Dark', value: 'dark' },
        ],
      },
    },
  },
  parameters: {
    backgrounds: {
      default: 'transparent',
      values: [
        { name: 'transparent', value: 'transparent' },
        { name: 'light', value: '#f6f1e8' },
        { name: 'dark', value: '#0f1714' },
      ],
    },
    controls: {
      expanded: true,
    },
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'responsive',
      viewports: MINIMAL_VIEWPORTS,
    },
  },
};

export default preview;
