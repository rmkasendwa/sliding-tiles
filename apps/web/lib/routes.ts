export const routes = {
  home: '/',
  play: '/play',
  leaderboard: '/leaderboard',
  contact: '/contact',
  login: '/login',
  privacy: '/privacy',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  runs: '/runs',
  signup: '/signup',
  terms: '/terms',
  profile: '/profile',
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
