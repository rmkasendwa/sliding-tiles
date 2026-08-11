import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ShareResultCardCanvas } from './ShareResultCard';

const meta = {
  component: ShareResultCardCanvas,
  title: 'Game Board / Share Result Card',
} satisfies Meta<typeof ShareResultCardCanvas>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PersonalBest: Story = {
  args: {
    result: {
      completedAt: '2026-08-11T12:24:00.000Z',
      level: 12,
      moves: 84,
      personalBestLabel: 'New personal best',
      siteDomain: 'slidingtiles.app',
      timeLabel: '01:18',
    },
  },
  render: (args) => (
    <StoryFrame>
      <ShareResultCardCanvas {...args} />
    </StoryFrame>
  ),
};

export const ReplayBest: Story = {
  args: {
    result: {
      completedAt: '2026-08-11T12:24:00.000Z',
      level: 7,
      moves: 49,
      personalBestLabel: 'Replay best improved',
      siteDomain: 'slidingtiles.app',
      timeLabel: '00:42',
    },
  },
  render: (args) => (
    <StoryFrame>
      <ShareResultCardCanvas {...args} />
    </StoryFrame>
  ),
};

export const RegularWin: Story = {
  args: {
    result: {
      completedAt: '2026-08-11T12:24:00.000Z',
      level: 3,
      moves: 31,
      personalBestLabel: null,
      siteDomain: 'slidingtiles.app',
      timeLabel: '00:26',
    },
  },
  render: (args) => (
    <StoryFrame>
      <ShareResultCardCanvas {...args} />
    </StoryFrame>
  ),
};

function StoryFrame({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-night p-6">
      <div className="w-full max-w-5xl">{children}</div>
    </main>
  );
}
