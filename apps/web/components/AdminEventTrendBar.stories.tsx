import type { Meta, StoryObj } from '@storybook/react-vite';

import { AdminEventTrendBar } from './AdminEventTrendBar';

const meta = {
  args: {
    dateLabel: 'Aug 12',
    delta: 18,
    eventLabel: 'Puzzle completed',
    max: 120,
    value: 84,
  },
  component: AdminEventTrendBar,
  decorators: [
    (Story) => (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <div className="grid w-full max-w-xl gap-4 rounded-[8px] border border-line bg-surface p-5 shadow-card-lift">
          <div className="flex h-48 items-end gap-2 border-b border-line px-2">
            <Story />
          </div>
        </div>
      </main>
    ),
  ],
  title: 'Components / Admin Event Trend Bar',
} satisfies Meta<typeof AdminEventTrendBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PositiveDelta: Story = {};

export const NegativeDelta: Story = {
  args: {
    dateLabel: 'Aug 13',
    delta: -11,
    value: 42,
  },
};

export const StartOfRange: Story = {
  args: {
    dateLabel: 'Aug 10',
    delta: null,
    value: 28,
  },
};
