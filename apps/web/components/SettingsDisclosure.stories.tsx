import type { Meta, StoryObj } from '@storybook/react-vite';

import { SettingsDisclosure } from './SettingsDisclosure';

const meta = {
  args: {
    badge: 'Optional',
    children: (
      <div className="grid gap-3 text-sm text-muted">
        <label className="flex items-center justify-between gap-4">
          <span>Use reduced motion</span>
          <input className="size-4 accent-[var(--color-accent)]" type="checkbox" />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span>Play move sounds</span>
          <input
            className="size-4 accent-[var(--color-accent)]"
            defaultChecked
            type="checkbox"
          />
        </label>
      </div>
    ),
    description: 'Tune the board behavior for this device.',
    title: 'Gameplay preferences',
  },
  component: SettingsDisclosure,
  decorators: [
    (Story) => (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <div className="w-full max-w-xl">
          <Story />
        </div>
      </main>
    ),
  ],
  title: 'Components / Settings Disclosure',
} satisfies Meta<typeof SettingsDisclosure>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const WithActiveBadge: Story = {
  args: {
    badge: 'Active',
    description: 'Sound and motion settings are ready to review.',
    title: 'Accessibility settings',
  },
};
