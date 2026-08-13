import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { CompletionEffects } from './CompletionEffects';

const completedPuzzleImage =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"%3E%3Crect width="800" height="800" fill="%23182721"/%3E%3Cpath d="M0 560 260 300l150 150 130-130 260 260v220H0Z" fill="%236ba56f"/%3E%3Ccircle cx="610" cy="190" r="72" fill="%23f3d46b"/%3E%3C/svg%3E';

function DailyCompletionHarness({
  submitDailyChallenge,
}: {
  submitDailyChallenge: () => Promise<void>;
}) {
  const [isComplete, setIsComplete] = useState(false);
  const [submissionState, setSubmissionState] = useState('Ready to solve');

  const completeChallenge = async () => {
    setIsComplete(true);
    setSubmissionState('Submitting score');
    await submitDailyChallenge();
    setSubmissionState('Score submitted');
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <section className="grid w-full max-w-xl gap-4">
        <div
          aria-label="Daily challenge board"
          className="relative aspect-square overflow-hidden rounded-lg border border-line bg-night shadow-panel"
        >
          <div className="absolute inset-0 grid grid-cols-3 gap-1 p-1" aria-hidden="true">
            {Array.from({ length: 9 }, (_, index) => (
              <span
                className="rounded-sm border border-surface/20 bg-primary/25"
                key={index}
              />
            ))}
          </div>
          <CompletionEffects
            celebrationMessage="Daily score submitted. Your first successful solve is locked for today."
            confettiBurstKey={isComplete ? 1 : null}
            imageUrl={completedPuzzleImage}
            isAutoPlayCompletion={false}
            isCelebrating={isComplete}
            isCompletionImageVisible={isComplete}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-muted" role="status">
            {submissionState}
          </p>
          <button
            className="rounded-md bg-primary px-4 py-2 font-bold text-primary-contrast disabled:opacity-60"
            disabled={isComplete}
            onClick={() => void completeChallenge()}
            type="button"
          >
            Complete daily challenge
          </button>
        </div>
      </section>
    </main>
  );
}

const meta = {
  component: DailyCompletionHarness,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Game Board / Daily Completion',
} satisfies Meta<typeof DailyCompletionHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SubmissionDoesNotDismissCelebration: Story = {
  args: {
    submitDailyChallenge: fn(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Complete daily challenge' }),
    );

    await waitFor(() => expect(args.submitDailyChallenge).toHaveBeenCalledOnce());
    await canvas.findByText('Score submitted');

    await expect(
      canvas.getByRole('img', { name: 'Completed puzzle image' }),
    ).toBeInTheDocument();
    await expect(canvas.getByText('Level complete')).toBeInTheDocument();
    await expect(
      canvas.getByLabelText('Daily challenge board'),
    ).toBeInTheDocument();
    await expect(canvas.queryByText('Daily complete')).not.toBeInTheDocument();
  },
};
