export const routes = {
  home: '/',
  play: '/play',
  leaderboard: '/leaderboard',
  login: '/login',
  signup: '/signup',
  profile: '/profile',
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
