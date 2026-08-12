import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowRight, Home, RotateCcw, Trophy } from 'lucide-react';

import { ErrorState, NotFoundErrorState } from './ErrorState';

const meta = {
  component: ErrorState,
  title: 'Components / Error State',
} satisfies Meta<typeof ErrorState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NotFound: Story = {
  args: {
    eyebrow: 'Sliding Tiles',
    message:
      'That route does not exist, or the tile you followed moved somewhere else.',
    status: '404',
    title: 'This page is missing',
  },
  render: () => (
    <StoryFrame>
      <NotFoundErrorState />
    </StoryFrame>
  ),
};

export const RecoverableError: Story = {
  args: {
    actions: [
      { icon: RotateCcw, label: 'Try again', onClick: () => {}, tone: 'primary' },
      { href: '/', icon: Home, label: 'Home', tone: 'secondary' },
      { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    ],
    eyebrow: 'Sliding Tiles',
    message:
      'The leaderboard could not refresh. Your board is safe, and you can try loading the scores again.',
    status: '500',
    title: 'Scores slipped out of place',
  },
  render: (args) => (
    <StoryFrame>
      <ErrorState {...args}>
        <p className="rounded-[7px] border border-line bg-panel/70 px-3 py-2 text-sm font-semibold text-muted">
          Last checked just now
        </p>
      </ErrorState>
    </StoryFrame>
  ),
};

export const CompactActions: Story = {
  args: {
    actions: [
      { href: '/', icon: Home, label: 'Home', tone: 'primary' },
      { href: '/play', icon: ArrowRight, label: 'Play' },
    ],
    eyebrow: 'Daily puzzle',
    message:
      "Today's challenge is not available yet. Come back after the board resets.",
    status: 'Pending',
    title: 'Daily board is warming up',
  },
  render: (args) => (
    <StoryFrame>
      <ErrorState {...args} />
    </StoryFrame>
  ),
};

function StoryFrame({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-night text-foreground">{children}</main>;
}
