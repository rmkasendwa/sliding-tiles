import type { Meta, StoryObj } from '@storybook/react-vite';

import { DatePicker } from './DatePicker';

const meta = {
  args: {
    'aria-label': 'Challenge date',
    defaultValue: '2026-08-12',
    max: '2026-12-31',
    min: '2026-01-01',
    name: 'challengeDate',
  },
  component: DatePicker,
  decorators: [
    (Story) => (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <div className="grid w-full max-w-sm gap-3 rounded-[8px] border border-line bg-surface p-5 shadow-card-lift">
          <label className="text-sm font-bold text-foreground" htmlFor="challenge-date">
            Challenge date
          </label>
          <Story />
          <p className="text-sm leading-6 text-muted">
            Pick the day whose puzzle stats should be reviewed.
          </p>
        </div>
      </main>
    ),
  ],
  title: 'Components / Date Picker',
} satisfies Meta<typeof DatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Selected: Story = {
  args: {
    id: 'challenge-date',
  },
};

export const EmptyRequired: Story = {
  args: {
    defaultValue: undefined,
    id: 'required-challenge-date',
    required: true,
  },
};

export const WithError: Story = {
  args: {
    defaultValue: '2026-08-13',
    error: 'Choose a date before the current challenge closes.',
    id: 'challenge-date-error',
  },
};
