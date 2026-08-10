'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';

export type ShareResultCardData = {
  completedAt: string;
  level: number;
  moves: number;
  personalBestLabel: string | null;
  timeLabel: string;
};

const CARD_HEIGHT = 630;
const CARD_WIDTH = 1200;

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawShareCard(
  canvas: HTMLCanvasElement,
  result: ShareResultCardData,
) {
  const context = canvas.getContext('2d');
  if (!context) return;

  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const completedDate = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(result.completedAt));

  context.fillStyle = '#071b17';
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const gradient = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  gradient.addColorStop(0, '#0f3f36');
  gradient.addColorStop(0.48, '#101f27');
  gradient.addColorStop(1, '#2f4f35');
  context.fillStyle = gradient;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  context.strokeStyle = 'rgba(207, 232, 172, 0.12)';
  context.lineWidth = 2;
  for (let x = -120; x < CARD_WIDTH + 160; x += 78) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + 260, CARD_HEIGHT);
    context.stroke();
  }
  for (let y = 70; y < CARD_HEIGHT; y += 98) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(CARD_WIDTH, y - 150);
    context.stroke();
  }

  drawRoundedRect(context, 56, 56, CARD_WIDTH - 112, CARD_HEIGHT - 112, 34);
  context.fillStyle = 'rgba(252, 255, 239, 0.94)';
  context.fill();

  drawRoundedRect(context, 82, 82, CARD_WIDTH - 164, CARD_HEIGHT - 164, 24);
  context.strokeStyle = 'rgba(17, 70, 57, 0.18)';
  context.lineWidth = 3;
  context.stroke();

  context.fillStyle = '#123f35';
  context.font =
    '800 34px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.fillText('Sliding Tiles', 112, 142);

  context.fillStyle = '#5a6b55';
  context.font =
    '700 22px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.fillText('Level completed', 112, 182);

  context.fillStyle = '#0c241f';
  context.font =
    '900 96px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.fillText(`Level ${result.level}`, 112, 292);

  if (result.personalBestLabel) {
    drawRoundedRect(context, 112, 322, 360, 54, 14);
    context.fillStyle = '#d7f4a1';
    context.fill();
    context.fillStyle = '#123f35';
    context.font =
      '900 24px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    context.fillText(result.personalBestLabel, 138, 357);
  }

  const statY = 448;
  const statWidth = 300;
  const statGap = 26;
  const stats = [
    ['Completion time', result.timeLabel],
    ['Moves', String(result.moves)],
    ['Completed', completedDate],
  ] as const;

  stats.forEach(([label, value], index) => {
    const x = 112 + index * (statWidth + statGap);
    drawRoundedRect(context, x, statY, statWidth, 104, 18);
    context.fillStyle = '#eef5df';
    context.fill();
    context.fillStyle = '#5a6b55';
    context.font =
      '800 18px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    context.fillText(label, x + 24, statY + 36);
    context.fillStyle = '#123f35';
    context.font =
      '900 32px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    context.fillText(value, x + 24, statY + 76);
  });

  context.fillStyle = '#123f35';
  context.font =
    '800 20px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.fillText('slidingtiles.app', 112, 594);

  context.fillStyle = '#d7f4a1';
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      if (row === 2 && column === 2) continue;
      drawRoundedRect(
        context,
        888 + column * 66,
        126 + row * 66,
        52,
        52,
        10,
      );
      context.fill();
    }
  }
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Could not generate the share image.'));
      }
    }, 'image/png');
  });
}

export function ShareResultCard({
  isOpen,
  onClose,
  result,
}: {
  isOpen: boolean;
  onClose: () => void;
  result: ShareResultCardData | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result || !isOpen) return;

    drawShareCard(canvas, result);
    setErrorMessage(null);
  }, [isOpen, result]);

  if (!isOpen || !result) {
    return null;
  }

  const createFile = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      throw new Error('The share card is not ready yet.');
    }

    const blob = await canvasToBlob(canvas);
    return new File([blob], `sliding-tiles-level-${result.level}.png`, {
      type: 'image/png',
    });
  };

  const downloadImage = async () => {
    try {
      const file = await createFile();
      const url = URL.createObjectURL(file);
      const anchor = document.createElement('a');
      anchor.download = file.name;
      anchor.href = url;
      anchor.click();
      URL.revokeObjectURL(url);
      setErrorMessage(null);
    } catch (error) {
      console.warn('Could not download share card.', error);
      setErrorMessage('The image could not be downloaded in this browser.');
    }
  };

  const shareImage = async () => {
    try {
      setIsSharing(true);
      const file = await createFile();
      const shareData = {
        files: [file],
        text: `I completed Level ${result.level} in ${result.timeLabel} with ${result.moves} moves.`,
        title: 'Sliding Tiles result',
      };

      if (!navigator.canShare?.(shareData)) {
        setErrorMessage('Direct sharing is not available in this browser.');
        return;
      }

      await navigator.share(shareData);
      setErrorMessage(null);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.warn('Could not share result card.', error);
        setErrorMessage('The image could not be shared in this browser.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        aria-labelledby="share-result-title"
        aria-modal="true"
        className="w-full max-w-xl rounded-lg border border-line bg-panel p-4 text-foreground shadow-panel"
        role="dialog"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase text-accent-strong">
              Share result
            </p>
            <h2 className="mt-1 text-lg font-extrabold" id="share-result-title">
              Level {result.level} card
            </h2>
          </div>
          <button
            aria-label="Close share card"
            className="grid size-9 cursor-pointer place-items-center rounded-md border border-line transition-colors hover:bg-accent/10"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <canvas
          aria-label={`Sliding Tiles Level ${result.level} share card`}
          className="mt-4 block aspect-[1200/630] w-full rounded-md border border-line bg-background"
          ref={canvasRef}
        />

        {errorMessage ? (
          <p className="mt-3 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm font-bold text-warning-strong">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-contrast shadow-button-primary transition-colors hover:bg-primary-strong disabled:cursor-wait disabled:opacity-60"
            disabled={isSharing}
            onClick={() => void shareImage()}
            type="button"
          >
            <Share2 aria-hidden="true" className="size-4" />
            Share
          </button>
          <button
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-panel px-4 py-2.5 text-sm font-extrabold text-foreground transition-colors hover:bg-accent/10"
            onClick={() => void downloadImage()}
            type="button"
          >
            <Download aria-hidden="true" className="size-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
