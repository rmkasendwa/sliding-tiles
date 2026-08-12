import { ArrowRight, Home, Trophy } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ErrorState, NotFoundErrorState } from './ErrorState';

const meta = {
  component: ErrorState,
  decorators: [
    (Story) => (
      <main className="min-h-screen bg-background text-foreground">
        <Story />
      </main>
    ),
  ],
  title: 'Components / Error State',
} satisfies Meta<typeof ErrorState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NotFound: Story = {
  args: {
    eyebrow: 'Sliding Tiles',
    message: 'Fallback args for the typed story wrapper.',
    status: '404',
    title: 'This page is missing',
  },
  render: () => <NotFoundErrorState />,
};

export const LeaderboardUnavailable: Story = {
  args: {
    actions: [
      { href: '/', icon: Home, label: 'Home', tone: 'primary' },
      { href: '/play', icon: ArrowRight, label: 'Play', tone: 'secondary' },
      {
        href: '/leaderboard',
        icon: Trophy,
        label: 'Try again',
        tone: 'secondary',
      },
    ],
    eyebrow: 'Sliding Tiles',
    message:
      'The leaderboard is taking longer than expected. Your local progress is safe while the scores catch up.',
    status: '503',
    title: 'Scores are catching up',
  },
};
