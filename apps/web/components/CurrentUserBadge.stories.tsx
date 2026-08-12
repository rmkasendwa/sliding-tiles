import type { Meta, StoryObj } from '@storybook/react-vite';

import { CurrentUserBadge } from './CurrentUserBadge';

const meta = {
  component: CurrentUserBadge,
  decorators: [
    (Story) => (
      <main className="grid min-h-screen place-items-center bg-night p-6">
        <div className="inline-flex items-center gap-2 rounded-[8px] border border-line bg-surface px-4 py-3 shadow-card-lift">
          <span className="font-bold text-foreground">Maya Stone</span>
          <Story />
        </div>
      </main>
    ),
  ],
  title: 'Components / Current User Badge',
} satisfies Meta<typeof CurrentUserBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
