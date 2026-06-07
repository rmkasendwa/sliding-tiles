import type { Metadata } from 'next';

import { routes, type AppRoute } from '@/lib/routes';
import { siteConfig } from '@/lib/site';

type PageMetadataConfig = {
  description?: string;
  image?: {
    alt: string;
    height: number;
    path: string;
    width: number;
  };
  path: AppRoute;
  title: string;
};

const defaultSocialImage = {
  alt: `${siteConfig.name}: ${siteConfig.tagline}`,
  height: 630,
  path: '/og-image.png',
  width: 1200,
} as const;

export const siteUrl = new URL(
  process.env.WEB_BASE_URL ??
    process.env.NEXT_PUBLIC_WEB_BASE_URL ??
    'http://localhost:3000',
);

export const defaultMetadata = {
  description: siteConfig.description,
  image: defaultSocialImage,
  title: `${siteConfig.name} | ${siteConfig.tagline}`,
} as const;

export const pageMetadataConfig = {
  contact: {
    description:
      'Contact Sliding Tiles for account support, bug reports, leaderboard concerns, accessibility issues, and feature ideas.',
    path: routes.contact,
    title: 'Contact',
  },
  forgotPassword: {
    description:
      'Request a secure password reset link for your Sliding Tiles account and get back to your saved puzzle progress.',
    path: routes.forgotPassword,
    title: 'Forgot Password',
  },
  home: {
    description: siteConfig.description,
    path: routes.home,
    title: siteConfig.name,
  },
  leaderboard: {
    description:
      'See the top Sliding Tiles players, fastest runs, cleanest solves, and live competitive rankings.',
    path: routes.leaderboard,
    title: 'Leaderboard',
  },
  login: {
    description:
      'Log in to Sliding Tiles to sync your puzzle progress, continue saved boards, and compete on the leaderboard.',
    path: routes.login,
    title: 'Login',
  },
  play: {
    description:
      'Play Sliding Tiles, solve a scrambled tile puzzle, save your board, and chase faster completion times.',
    path: routes.play,
    title: 'Play',
  },
  privacy: {
    description:
      'Learn how Sliding Tiles handles account details, gameplay records, cookies, local storage, and leaderboard data.',
    path: routes.privacy,
    title: 'Privacy Policy',
  },
  profile: {
    description:
      'View your Sliding Tiles profile, saved board, run history, personal bests, and account settings.',
    path: routes.profile,
    title: 'Profile',
  },
  resetPassword: {
    description:
      'Create a new Sliding Tiles password from a secure reset link and return to your saved puzzle progress.',
    path: routes.resetPassword,
    title: 'Reset Password',
  },
  runs: {
    description:
      'Review your complete Sliding Tiles run history, compare original and replay attempts, and replay previous puzzle configurations.',
    path: routes.runs,
    title: 'Run History',
  },
  signup: {
    description:
      'Create a Sliding Tiles account to save puzzle progress, track runs, and climb the competitive leaderboard.',
    path: routes.signup,
    title: 'Register',
  },
  terms: {
    description:
      'Read the fair play, account, leaderboard, and service terms for playing Sliding Tiles.',
    path: routes.terms,
    title: 'Terms of Service',
  },
} satisfies Record<string, PageMetadataConfig>;

function pageTitle(title: string) {
  return title === siteConfig.name
    ? `${siteConfig.name} | ${siteConfig.tagline}`
    : `${title} | ${siteConfig.name}`;
}

export function createPageMetadata(config: PageMetadataConfig): Metadata {
  const description = config.description ?? defaultMetadata.description;
  const image = config.image ?? defaultMetadata.image;
  const title = pageTitle(config.title);

  return {
    alternates: {
      canonical: config.path,
    },
    description,
    openGraph: {
      description,
      images: [
        {
          alt: image.alt,
          height: image.height,
          url: image.path,
          width: image.width,
        },
      ],
      siteName: siteConfig.name,
      title,
      type: 'website',
      url: config.path,
    },
    title,
    twitter: {
      card: 'summary_large_image',
      description,
      images: [
        {
          alt: image.alt,
          url: image.path,
        },
      ],
      title,
    },
  };
}

export const pageMetadata = Object.fromEntries(
  Object.entries(pageMetadataConfig).map(([key, config]) => [
    key,
    createPageMetadata(config),
  ]),
) as Record<keyof typeof pageMetadataConfig, Metadata>;
