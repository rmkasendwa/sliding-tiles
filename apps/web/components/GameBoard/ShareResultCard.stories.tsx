import type { StoryDefault } from '@ladle/react';
import type { ReactNode } from 'react';

import { ShareResultCardCanvas } from './ShareResultCard';

export default {
  title: 'Game Board / Share Result Card',
} satisfies StoryDefault;

export const PersonalBest = () => (
  <StoryFrame>
    <ShareResultCardCanvas
      result={{
        completedAt: '2026-08-11T12:24:00.000Z',
        level: 12,
        moves: 84,
        personalBestLabel: 'New personal best',
        siteDomain: 'slidingtiles.app',
        timeLabel: '01:18',
      }}
    />
  </StoryFrame>
);

export const ReplayBest = () => (
  <StoryFrame>
    <ShareResultCardCanvas
      result={{
        completedAt: '2026-08-11T12:24:00.000Z',
        level: 7,
        moves: 49,
        personalBestLabel: 'Replay best improved',
        siteDomain: 'slidingtiles.app',
        timeLabel: '00:42',
      }}
    />
  </StoryFrame>
);

export const RegularWin = () => (
  <StoryFrame>
    <ShareResultCardCanvas
      result={{
        completedAt: '2026-08-11T12:24:00.000Z',
        level: 3,
        moves: 31,
        personalBestLabel: null,
        siteDomain: 'slidingtiles.app',
        timeLabel: '00:26',
      }}
    />
  </StoryFrame>
);

function StoryFrame({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-night p-6">
      <div className="w-full max-w-5xl">{children}</div>
    </main>
  );
}
