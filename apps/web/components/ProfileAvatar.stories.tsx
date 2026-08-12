import type { Meta, StoryObj } from '@storybook/react-vite';

import { ProfileAvatar } from './ProfileAvatar';

const meta = {
  args: {
    name: 'Maya Stone',
    size: 64,
  },
  component: ProfileAvatar,
  decorators: [
    (Story) => (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <div className="flex items-center gap-4 rounded-[8px] border border-line bg-surface p-5 shadow-card-lift">
          <Story />
          <div className="grid gap-1">
            <p className="text-base font-bold text-foreground">Player profile</p>
            <p className="text-sm text-muted">Avatar preview</p>
          </div>
        </div>
      </main>
    ),
  ],
  title: 'Components / Profile Avatar',
} satisfies Meta<typeof ProfileAvatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Initials: Story = {};

export const SingleName: Story = {
  args: {
    name: 'Ronald',
  },
};

export const Small: Story = {
  args: {
    name: 'Maya Stone',
    size: 32,
  },
};

export const WithAvatarUrl: Story = {
  args: {
    avatarUrl:
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon',
    name: 'Maya Stone',
  },
};
