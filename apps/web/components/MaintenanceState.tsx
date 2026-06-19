import { Home, Play, Wrench } from 'lucide-react';

import { ErrorState } from '@/components/ErrorState';
import { routes } from '@/lib/routes';

export function MaintenanceState() {
  return (
    <ErrorState
      actions={[
        { href: routes.home, icon: Home, label: 'Home', tone: 'primary' },
        { href: routes.play, icon: Play, label: 'Play', tone: 'secondary' },
      ]}
      eyebrow="Sliding Tiles"
      message="A service interruption is keeping this part of the board from loading. Please try again soon."
      status="Paused"
      title="We are tuning the board"
    >
      <div className="inline-flex items-center gap-2 rounded-[7px] border border-warning/28 bg-warning-soft px-3 py-2 text-sm font-bold text-warning-strong">
        <Wrench aria-hidden="true" className="size-4" />
        Service update
      </div>
    </ErrorState>
  );
}
