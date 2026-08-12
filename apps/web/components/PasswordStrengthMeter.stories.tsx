import type { Meta, StoryObj } from '@storybook/react-vite';

import { PasswordStrengthMeter } from './PasswordStrengthMeter';

const meta = {
  args: {
    password: 'SlidingTiles2026!',
  },
  component: PasswordStrengthMeter,
  decorators: [
    (Story) => (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <div className="w-full max-w-sm rounded-[8px] border border-line bg-surface p-5 shadow-card-lift">
          <label className="grid gap-2 text-sm font-bold text-foreground">
            Password
            <input
              className="min-h-11 rounded-[7px] border border-line bg-panel px-3 text-base text-foreground"
              readOnly
              type="password"
              value="password-preview"
            />
          </label>
          <Story />
        </div>
      </main>
    ),
  ],
  title: 'Components / Password Strength Meter',
} satisfies Meta<typeof PasswordStrengthMeter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Weak: Story = {
  args: {
    password: 'frog',
  },
};

export const Fair: Story = {
  args: {
    password: 'Frogslide',
  },
};

export const Good: Story = {
  args: {
    password: 'Frogslide7',
  },
};

export const Strong: Story = {
  args: {
    password: 'Frogslide7!',
  },
};
