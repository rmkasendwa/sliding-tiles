export const routes = {
  home: '/',
  play: '/play',
  leaderboard: '/leaderboard',
  contact: '/contact',
  emailVerification: '/email-verification',
  login: '/login',
  privacy: '/privacy',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  runs: '/runs',
  signup: '/signup',
  terms: '/terms',
  verifyEmail: '/verify-email',
  profile: '/profile',
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
