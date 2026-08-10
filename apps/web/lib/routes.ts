export const routes = {
  admin: '/admin',
  adminAnalytics: '/admin/analytics',
  adminEvents: '/admin/events',
  adminUsers: '/admin/users',
  home: '/',
  play: '/play',
  daily: '/daily',
  leaderboard: '/leaderboard',
  contact: '/contact',
  emailVerification: '/email-verification',
  login: '/login',
  privacy: '/privacy',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  runs: '/runs',
  statistics: '/statistics',
  register: '/register',
  terms: '/terms',
  verifyEmail: '/verify-email',
  profile: '/profile',
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
