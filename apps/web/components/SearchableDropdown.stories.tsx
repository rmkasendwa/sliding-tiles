import type { Meta, StoryObj } from '@storybook/react-vite';

import { SearchableDropdown, type DropdownOption } from './SearchableDropdown';

const puzzleOptions: DropdownOption[] = [
  { label: 'Daily challenge', metadata: 'Public leaderboard', value: 'daily' },
  { label: 'Practice board', metadata: 'Private session', value: 'practice' },
  { label: 'Custom image', metadata: 'Upload required', value: 'custom' },
  { disabled: true, label: 'Tournament', metadata: 'Locked', value: 'tournament' },
];

const meta = {
  args: {
    'aria-label': 'Puzzle mode',
    clearable: true,
    defaultValue: 'daily',
    name: 'puzzleMode',
    options: puzzleOptions,
    placeholder: 'Choose a mode',
    searchPlaceholder: 'Search modes...',
  },
  component: SearchableDropdown,
  decorators: [
    (Story) => (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <div className="grid w-full max-w-sm gap-3 rounded-[8px] border border-line bg-surface p-5 shadow-card-lift">
          <label className="text-sm font-bold text-foreground" htmlFor="puzzle-mode">
            Puzzle mode
          </label>
          <Story />
          <p className="text-sm leading-6 text-muted">
            Searchable controls use the same theme tokens as the app shell.
          </p>
        </div>
      </main>
    ),
  ],
  title: 'Components / Searchable Dropdown',
} satisfies Meta<typeof SearchableDropdown>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Selected: Story = {
  args: {
    id: 'puzzle-mode',
  },
};

export const Empty: Story = {
  args: {
    defaultValue: undefined,
    id: 'empty-puzzle-mode',
  },
};

export const Loading: Story = {
  args: {
    defaultValue: undefined,
    id: 'loading-puzzle-mode',
    loading: true,
  },
};
