import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MaintenanceState } from './MaintenanceState';

const meta = {
  component: MaintenanceState,
  title: 'Components / Maintenance State',
} satisfies Meta<typeof MaintenanceState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StoryFrame>
      <MaintenanceState />
    </StoryFrame>
  ),
};

function StoryFrame({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-night text-foreground">{children}</main>;
}
