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
const FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

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

function drawTextWithTracking(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
) {
  let cursor = x;
  for (const character of text) {
    context.fillText(character, cursor, y);
    cursor += context.measureText(character).width + tracking;
  }
}

function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  if (context.measureText(text).width <= maxWidth) {
    return text;
  }

  let nextText = text;
  while (nextText.length > 1 && context.measureText(`${nextText}...`).width > maxWidth) {
    nextText = nextText.slice(0, -1);
  }

  return `${nextText}...`;
}

export function drawShareCard(
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
  const serial = `LV-${String(result.level).padStart(3, '0')}-${String(result.moves).padStart(3, '0')}`;

  context.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  context.fillStyle = '#160e05';
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const cardGradient = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  cardGradient.addColorStop(0, '#fff0a7');
  cardGradient.addColorStop(0.18, '#c89127');
  cardGradient.addColorStop(0.42, '#7b4a0c');
  cardGradient.addColorStop(0.62, '#ffd971');
  cardGradient.addColorStop(0.78, '#9c6116');
  cardGradient.addColorStop(1, '#3b2208');
  context.fillStyle = cardGradient;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const glow = context.createRadialGradient(260, 160, 20, 260, 160, 460);
  glow.addColorStop(0, 'rgba(255, 255, 232, 0.78)');
  glow.addColorStop(0.45, 'rgba(255, 205, 88, 0.18)');
  glow.addColorStop(1, 'rgba(255, 205, 88, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const jewelGlow = context.createRadialGradient(945, 160, 12, 945, 160, 310);
  jewelGlow.addColorStop(0, 'rgba(84, 255, 219, 0.64)');
  jewelGlow.addColorStop(0.4, 'rgba(43, 120, 255, 0.2)');
  jewelGlow.addColorStop(1, 'rgba(43, 120, 255, 0)');
  context.fillStyle = jewelGlow;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const magentaGlow = context.createRadialGradient(930, 500, 10, 930, 500, 300);
  magentaGlow.addColorStop(0, 'rgba(255, 91, 192, 0.32)');
  magentaGlow.addColorStop(1, 'rgba(255, 91, 192, 0)');
  context.fillStyle = magentaGlow;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  context.save();
  context.globalAlpha = 0.18;
  context.strokeStyle = '#fff7bc';
  context.lineWidth = 2;
  for (let x = -220; x < CARD_WIDTH + 260; x += 76) {
    context.beginPath();
    context.moveTo(x, -20);
    context.lineTo(x + 320, CARD_HEIGHT + 20);
    context.stroke();
  }
  context.globalAlpha = 0.1;
  context.strokeStyle = '#3b2208';
  for (let y = 38; y < CARD_HEIGHT + 120; y += 72) {
    context.beginPath();
    context.moveTo(-60, y);
    context.lineTo(CARD_WIDTH + 60, y - 210);
    context.stroke();
  }
  context.restore();

  drawRoundedRect(context, 48, 48, CARD_WIDTH - 96, CARD_HEIGHT - 96, 42);
  context.strokeStyle = 'rgba(255, 252, 209, 0.76)';
  context.lineWidth = 5;
  context.stroke();
  drawRoundedRect(context, 66, 66, CARD_WIDTH - 132, CARD_HEIGHT - 132, 30);
  context.strokeStyle = 'rgba(71, 40, 6, 0.42)';
  context.lineWidth = 3;
  context.stroke();

  drawRoundedRect(context, 82, 86, 176, 128, 22);
  const chipGradient = context.createLinearGradient(82, 86, 258, 214);
  chipGradient.addColorStop(0, '#fff8cb');
  chipGradient.addColorStop(0.36, '#c98d1e');
  chipGradient.addColorStop(0.66, '#ffdc73');
  chipGradient.addColorStop(1, '#76500f');
  context.fillStyle = chipGradient;
  context.fill();
  context.strokeStyle = 'rgba(83, 45, 5, 0.54)';
  context.lineWidth = 3;
  context.stroke();
  context.strokeStyle = 'rgba(255, 251, 212, 0.58)';
  context.lineWidth = 2;
  for (let x = 112; x <= 228; x += 38) {
    context.beginPath();
    context.moveTo(x, 94);
    context.lineTo(x, 206);
    context.stroke();
  }
  for (let y = 126; y <= 174; y += 32) {
    context.beginPath();
    context.moveTo(90, y);
    context.lineTo(250, y);
    context.stroke();
  }

  context.fillStyle = 'rgba(47, 26, 5, 0.78)';
  context.font = `900 28px ${FONT_STACK}`;
  drawTextWithTracking(context, 'SLIDING TILES', 302, 118, 2.4);
  context.font = `800 21px ${FONT_STACK}`;
  context.fillStyle = 'rgba(47, 26, 5, 0.58)';
  drawTextWithTracking(context, 'RESULT CARD', 306, 154, 3);

  context.textAlign = 'right';
  context.font = `800 24px ${FONT_STACK}`;
  context.fillStyle = 'rgba(255, 251, 209, 0.88)';
  context.fillText(serial, 1088, 116);
  context.textAlign = 'left';

  context.fillStyle = 'rgba(47, 26, 5, 0.16)';
  context.font = `900 116px ${FONT_STACK}`;
  context.fillText(`LEVEL ${result.level}`, 103, 315);
  context.fillStyle = '#2f1a05';
  context.font = `900 112px ${FONT_STACK}`;
  context.fillText(`LEVEL ${result.level}`, 98, 308);

  const badgeText = result.personalBestLabel ?? 'Level completed';
  context.font = `900 23px ${FONT_STACK}`;
  const badgeWidth = Math.max(302, context.measureText(badgeText).width + 64);
  drawRoundedRect(context, 100, 336, badgeWidth, 58, 18);
  context.fillStyle = result.personalBestLabel ? '#241205' : 'rgba(47, 26, 5, 0.72)';
  context.fill();
  context.strokeStyle = 'rgba(255, 246, 177, 0.45)';
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = result.personalBestLabel ? '#ffe58a' : '#fff3b5';
  context.fillText(badgeText, 132, 373);

  const statY = 448;
  const statWidth = 302;
  const statGap = 28;
  const stats = [
    ['Time', result.timeLabel],
    ['Moves', String(result.moves)],
    ['Completed', completedDate],
  ] as const;

  stats.forEach(([label, value], index) => {
    const x = 98 + index * (statWidth + statGap);
    drawRoundedRect(context, x, statY, statWidth, 110, 20);
    context.fillStyle = 'rgba(255, 249, 206, 0.22)';
    context.fill();
    context.strokeStyle = 'rgba(255, 246, 177, 0.36)';
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = 'rgba(47, 26, 5, 0.72)';
    context.font = `900 18px ${FONT_STACK}`;
    drawTextWithTracking(context, label.toUpperCase(), x + 24, statY + 36, 1.8);
    context.fillStyle = '#fff4bd';
    context.font = `900 34px ${FONT_STACK}`;
    context.fillText(fitText(context, value, statWidth - 48), x + 24, statY + 80);
  });

  context.fillStyle = 'rgba(255, 251, 212, 0.84)';
  context.font = `800 20px ${FONT_STACK}`;
  context.fillText('slidingtiles.app', 98, 594);

  const tileGradient = context.createLinearGradient(810, 178, 1068, 396);
  tileGradient.addColorStop(0, '#fff6b2');
  tileGradient.addColorStop(0.36, '#32e3d1');
  tileGradient.addColorStop(0.64, '#7a68ff');
  tileGradient.addColorStop(1, '#ff6bbd');
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      if (row === 2 && column === 2) continue;
      const x = 818 + column * 82;
      const y = 190 + row * 82;
      drawRoundedRect(
        context,
        x,
        y,
        62,
        62,
        13,
      );
      context.fillStyle = tileGradient;
      context.fill();
      context.strokeStyle = 'rgba(255, 251, 212, 0.72)';
      context.lineWidth = 3;
      context.stroke();
      context.fillStyle = 'rgba(47, 26, 5, 0.5)';
      context.font = `900 20px ${FONT_STACK}`;
      context.fillText(String(row * 3 + column + 1), x + 22, y + 39);
    }
  }

  context.fillStyle = 'rgba(47, 26, 5, 0.62)';
  context.font = `900 18px ${FONT_STACK}`;
  drawTextWithTracking(context, 'KEEP THIS WIN', 818, 464, 2.8);
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

export function ShareResultCardCanvas({
  className = '',
  result,
}: {
  className?: string;
  result: ShareResultCardData;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    drawShareCard(canvas, result);
  }, [result]);

  return (
    <canvas
      aria-label={`Sliding Tiles Level ${result.level} share card preview`}
      className={[
        'block aspect-[1200/630] w-full rounded-lg bg-background shadow-panel',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      ref={canvasRef}
    />
  );
}
