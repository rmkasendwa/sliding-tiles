export const ogPages = {
  contact: {
    description:
      'Need help, spotted a rough edge, or have a sharper idea for the board? Send it through.',
    eyebrow: 'Support channel',
    file: 'contact.png',
    tagline: 'Questions, ideas, and fixes.',
    title: 'Contact',
  },
  emailVerification: {
    description:
      'One quick confirmation, then your runs and records stay tied to the right player.',
    eyebrow: 'Account security',
    file: 'email-verification.png',
    tagline: 'Confirm your game identity.',
    title: 'Email Verification',
  },
  forgotPassword: {
    description:
      'Reset the key, keep the pace, and get your puzzle progress back under your fingers.',
    eyebrow: 'Account recovery',
    file: 'forgot-password.png',
    tagline: 'Get back to your saved board.',
    title: 'Forgot Password',
  },
  home: {
    description:
      'A little pond, a scrambled picture, and one clean path hiding in plain sight.',
    eyebrow: 'Race the board',
    file: 'home.png',
    tagline: 'Fast. Simple. Competitive.',
    title: 'Sliding Tiles',
  },
  leaderboard: {
    description:
      'The board remembers every second, every move, and every player chasing a cleaner solve.',
    eyebrow: 'Global rankings',
    file: 'leaderboard.png',
    tagline: 'Fast frogs. Clean runs.',
    title: 'Leaderboard',
  },
  login: {
    description:
      'Your saved board is waiting. Step back in and make the next move count.',
    eyebrow: 'Saved progress',
    file: 'login.png',
    tagline: 'Pick up where you left off.',
    title: 'Login',
  },
  play: {
    description:
      'Shuffle the scene, trust your eye, and turn a messy grid into one crisp picture.',
    eyebrow: 'Puzzle sprint',
    file: 'play.png',
    tagline: 'Slide fast. Solve clean.',
    title: 'Play',
  },
  privacy: {
    description:
      'Progress, records, and account details should be useful to the game and clear to the player.',
    eyebrow: 'Player data',
    file: 'privacy.png',
    tagline: 'Clear rules for progress and records.',
    title: 'Privacy Policy',
  },
  profile: {
    description:
      'Your best runs, current board, and next improvement are all gathered in one place.',
    eyebrow: 'Personal stats',
    file: 'profile.png',
    tagline: 'Runs, pace, and saved progress.',
    title: 'Profile',
  },
  register: {
    description:
      'Claim a name, save your progress, and start leaving better times behind you.',
    eyebrow: 'Join the race',
    file: 'register.png',
    tagline: 'Save runs and climb the board.',
    title: 'Register',
  },
  resetPassword: {
    description:
      'Set a fresh password and return to the board without losing your rhythm.',
    eyebrow: 'Secure reset',
    file: 'reset-password.png',
    tagline: 'Return to the puzzle safely.',
    title: 'Reset Password',
  },
  runs: {
    description:
      'Every attempt leaves a trail. Replay the good ones and learn from the stubborn ones.',
    eyebrow: 'Run history',
    file: 'runs.png',
    tagline: 'Replay, compare, improve.',
    title: 'Run History',
  },
  terms: {
    description:
      'Simple rules for fair play, honest records, and a leaderboard worth chasing.',
    eyebrow: 'Fair play',
    file: 'terms.png',
    tagline: 'Rules for clean competition.',
    title: 'Terms of Service',
  },
} as const;

export type OgPageKey = keyof typeof ogPages;
export type OgPage = (typeof ogPages)[OgPageKey];
