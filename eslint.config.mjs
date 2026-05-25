import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: [
      '**/.next/**',
      '**/dist/**',
      '**/node_modules/**',
      'apps/web/.next/**',
    ],
  },
  {
    settings: {
      next: {
        rootDir: 'apps/web/',
      },
    },
  },
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
];

export default config;
