import { Eye, RotateCcw, Share2 } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { GameToolButton } from './GameToolButton';

const meta = {
  args: {
    description: 'Reset the current puzzle to its starting configuration.',
    icon: <RotateCcw aria-hidden="true" className="size-4" />,
    tooltip: 'Reset puzzle',
    type: 'button',
  },
  component: GameToolButton,
  decorators: [
    (Story) => (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <div className="grid gap-4 rounded-[8px] border border-line bg-surface p-5 text-accent-strong shadow-card-lift">
          <div className="flex items-center gap-2">
            <Story />
            <GameToolButton
              aria-label="Show preview"
              description="Peek at the completed puzzle image."
              icon={<Eye aria-hidden="true" className="size-4" />}
              tooltip="Peek"
              type="button"
            />
            <GameToolButton
              aria-label="Share result"
              description="Create a share image for the latest result."
              icon={<Share2 aria-hidden="true" className="size-4" />}
              tooltip="Share"
              type="button"
            />
          </div>
          <p className="text-sm text-muted">Hover or focus a button to preview its tooltip.</p>
        </div>
      </main>
    ),
  ],
  title: 'Game Board / Game Tool Button',
} satisfies Meta<typeof GameToolButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    'aria-label': 'Reset current puzzle',
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Reset current puzzle',
    disabled: true,
  },
};
