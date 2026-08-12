import type { Meta, StoryObj } from '@storybook/react-vite';

import { MaintenanceState } from './MaintenanceState';

const meta = {
  component: MaintenanceState,
  decorators: [
    (Story) => (
      <main className="min-h-screen bg-background text-foreground">
        <Story />
      </main>
    ),
  ],
  title: 'Components / Maintenance State',
} satisfies Meta<typeof MaintenanceState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
