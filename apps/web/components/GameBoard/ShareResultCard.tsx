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

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: CanvasFillStrokeStyles['fillStyle'],
) {
  drawRoundedRect(context, x, y, width, height, radius);
  context.fillStyle = fillStyle;
  context.fill();
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
  const badgeText = result.personalBestLabel ?? 'Level completed';

  context.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  context.fillStyle = '#070908';
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const cardGradient = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  cardGradient.addColorStop(0, '#f8d56d');
  cardGradient.addColorStop(0.12, '#fff1a8');
  cardGradient.addColorStop(0.28, '#b87414');
  cardGradient.addColorStop(0.52, '#3a2208');
  cardGradient.addColorStop(0.72, '#e4ad39');
  cardGradient.addColorStop(1, '#7b2f12');
  context.fillStyle = cardGradient;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const darkVignette = context.createRadialGradient(580, 280, 120, 580, 280, 780);
  darkVignette.addColorStop(0, 'rgba(30, 16, 3, 0)');
  darkVignette.addColorStop(0.64, 'rgba(30, 16, 3, 0.12)');
  darkVignette.addColorStop(1, 'rgba(3, 5, 4, 0.62)');
  context.fillStyle = darkVignette;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const warmGlow = context.createRadialGradient(250, 90, 24, 250, 90, 440);
  warmGlow.addColorStop(0, 'rgba(255, 249, 194, 0.72)');
  warmGlow.addColorStop(0.5, 'rgba(255, 211, 84, 0.2)');
  warmGlow.addColorStop(1, 'rgba(255, 211, 84, 0)');
  context.fillStyle = warmGlow;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const enamelGlow = context.createRadialGradient(885, 278, 20, 885, 278, 420);
  enamelGlow.addColorStop(0, 'rgba(60, 239, 212, 0.38)');
  enamelGlow.addColorStop(0.52, 'rgba(95, 85, 255, 0.16)');
  enamelGlow.addColorStop(1, 'rgba(95, 85, 255, 0)');
  context.fillStyle = enamelGlow;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const roseGlow = context.createRadialGradient(1030, 522, 20, 1030, 522, 360);
  roseGlow.addColorStop(0, 'rgba(255, 85, 148, 0.26)');
  roseGlow.addColorStop(1, 'rgba(255, 85, 148, 0)');
  context.fillStyle = roseGlow;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  context.save();
  context.globalAlpha = 0.08;
  context.strokeStyle = '#fff6bd';
  context.lineWidth = 3;
  for (let x = -180; x < CARD_WIDTH + 260; x += 92) {
    context.beginPath();
    context.moveTo(x, -40);
    context.lineTo(x + 290, CARD_HEIGHT + 40);
    context.stroke();
  }
  context.globalAlpha = 0.1;
  context.strokeStyle = '#140a02';
  context.lineWidth = 2;
  for (let y = 80; y < CARD_HEIGHT + 120; y += 84) {
    context.beginPath();
    context.moveTo(-80, y);
    context.lineTo(CARD_WIDTH + 80, y - 160);
    context.stroke();
  }
  context.restore();

  const outerStroke = context.createLinearGradient(60, 54, 1140, 576);
  outerStroke.addColorStop(0, '#fff8c9');
  outerStroke.addColorStop(0.24, '#f0b73a');
  outerStroke.addColorStop(0.5, '#fff6b7');
  outerStroke.addColorStop(0.78, '#b56f18');
  outerStroke.addColorStop(1, '#fff0a2');
  drawRoundedRect(context, 50, 50, CARD_WIDTH - 100, CARD_HEIGHT - 100, 48);
  context.strokeStyle = outerStroke;
  context.lineWidth = 8;
  context.stroke();

  fillRoundedRect(context, 78, 78, CARD_WIDTH - 156, CARD_HEIGHT - 156, 34, 'rgba(12, 9, 5, 0.24)');
  drawRoundedRect(context, 78, 78, CARD_WIDTH - 156, CARD_HEIGHT - 156, 34);
  context.strokeStyle = 'rgba(255, 245, 181, 0.32)';
  context.lineWidth = 2;
  context.stroke();

  const headerPanel = context.createLinearGradient(92, 92, 760, 196);
  headerPanel.addColorStop(0, 'rgba(255, 246, 174, 0.22)');
  headerPanel.addColorStop(1, 'rgba(24, 12, 3, 0.3)');
  fillRoundedRect(context, 92, 92, 650, 118, 24, headerPanel);

  const chipGradient = context.createLinearGradient(112, 111, 256, 191);
  chipGradient.addColorStop(0, '#fff7bf');
  chipGradient.addColorStop(0.25, '#d38c18');
  chipGradient.addColorStop(0.55, '#ffe681');
  chipGradient.addColorStop(1, '#8e5a12');
  fillRoundedRect(context, 112, 110, 138, 82, 18, chipGradient);
  context.strokeStyle = 'rgba(45, 23, 3, 0.62)';
  context.lineWidth = 3;
  context.stroke();
  context.strokeStyle = 'rgba(255, 250, 206, 0.62)';
  context.lineWidth = 2;
  for (let x = 142; x <= 222; x += 40) {
    context.beginPath();
    context.moveTo(x, 122);
    context.lineTo(x, 180);
    context.stroke();
  }
  for (let y = 138; y <= 164; y += 26) {
    context.beginPath();
    context.moveTo(124, y);
    context.lineTo(238, y);
    context.stroke();
  }

  context.fillStyle = '#241305';
  context.font = `900 30px ${FONT_STACK}`;
  drawTextWithTracking(context, 'SLIDING TILES', 286, 134, 2.2);
  context.fillStyle = 'rgba(36, 19, 5, 0.66)';
  context.font = `800 18px ${FONT_STACK}`;
  drawTextWithTracking(context, 'VICTORY CARD', 288, 170, 3.4);

  fillRoundedRect(context, 815, 94, 278, 56, 18, 'rgba(13, 9, 4, 0.28)');
  context.textAlign = 'right';
  context.font = `900 24px ${FONT_STACK}`;
  context.fillStyle = '#fff3ae';
  context.fillText(serial, 1068, 131);
  context.textAlign = 'left';

  const levelGradient = context.createLinearGradient(96, 256, 662, 372);
  levelGradient.addColorStop(0, '#1a0c02');
  levelGradient.addColorStop(0.5, '#3b1d04');
  levelGradient.addColorStop(1, '#120701');
  context.fillStyle = 'rgba(255, 238, 142, 0.18)';
  context.font = `900 132px ${FONT_STACK}`;
  context.fillText(`LEVEL ${result.level}`, 104, 368);
  context.fillStyle = levelGradient;
  context.font = `900 126px ${FONT_STACK}`;
  context.fillText(`LEVEL ${result.level}`, 96, 356);

  const badgeWidth = Math.min(
    448,
    Math.max(312, context.measureText(badgeText).width + 70),
  );
  const badgeGradient = context.createLinearGradient(98, 392, 98 + badgeWidth, 452);
  badgeGradient.addColorStop(0, '#1e0e04');
  badgeGradient.addColorStop(0.55, '#5a3308');
  badgeGradient.addColorStop(1, '#1e0e04');
  fillRoundedRect(context, 98, 392, badgeWidth, 62, 20, badgeGradient);
  drawRoundedRect(context, 98, 392, badgeWidth, 62, 20);
  context.strokeStyle = result.personalBestLabel
    ? 'rgba(255, 234, 119, 0.88)'
    : 'rgba(255, 234, 119, 0.42)';
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = result.personalBestLabel ? '#ffe77a' : '#fff2b4';
  context.font = `900 24px ${FONT_STACK}`;
  context.fillText(fitText(context, badgeText, badgeWidth - 62), 128, 431);

  const markX = 784;
  const markY = 184;
  const tileSize = 72;
  const tileGap = 14;
  fillRoundedRect(context, 752, 162, 330, 314, 34, 'rgba(13, 10, 7, 0.22)');
  drawRoundedRect(context, 752, 162, 330, 314, 34);
  context.strokeStyle = 'rgba(255, 245, 181, 0.18)';
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = 'rgba(255, 241, 169, 0.92)';
  context.font = `900 17px ${FONT_STACK}`;
  drawTextWithTracking(context, 'PUZZLE SEALED', 790, 448, 2.4);

  const tileColors = [
    ['#fbffb5', '#6df1c5'],
    ['#56f1dc', '#2dbdc4'],
    ['#6ed1ff', '#6d6aff'],
    ['#3be2c6', '#2abaaa'],
    ['#55c9ff', '#5a77f0'],
    ['#806cff', '#c750df'],
    ['#55cdf2', '#4b95f3'],
    ['#7a66ff', '#a954f0'],
  ] as const;
  tileColors.forEach(([from, to], index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = markX + column * (tileSize + tileGap);
    const y = markY + row * (tileSize + tileGap);
    const tileGradient = context.createLinearGradient(x, y, x + tileSize, y + tileSize);
    tileGradient.addColorStop(0, from);
    tileGradient.addColorStop(1, to);
    fillRoundedRect(context, x, y, tileSize, tileSize, 17, tileGradient);
    context.strokeStyle = 'rgba(255, 251, 218, 0.74)';
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = 'rgba(33, 24, 16, 0.58)';
    context.font = `900 23px ${FONT_STACK}`;
    context.fillText(String(index + 1), x + 27, y + 46);
  });

  const stats = [
    ['Time', result.timeLabel],
    ['Moves', String(result.moves)],
    ['Completed', completedDate],
  ] as const;
  stats.forEach(([label, value], index) => {
    const width = index === 2 ? 330 : 220;
    const x = index === 0 ? 98 : index === 1 ? 346 : 594;
    const y = 488;
    fillRoundedRect(context, x, y, width, 88, 18, 'rgba(12, 8, 4, 0.34)');
    drawRoundedRect(context, x, y, width, 88, 18);
    context.strokeStyle = 'rgba(255, 239, 166, 0.34)';
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = '#f4bd42';
    context.font = `900 15px ${FONT_STACK}`;
    drawTextWithTracking(context, label.toUpperCase(), x + 22, y + 30, 1.8);
    context.fillStyle = '#fff3b5';
    context.font = `900 34px ${FONT_STACK}`;
    context.fillText(fitText(context, value, width - 44), x + 22, y + 68);
  });

  context.textAlign = 'right';
  context.fillStyle = 'rgba(255, 243, 181, 0.9)';
  context.font = `900 22px ${FONT_STACK}`;
  context.fillText('slidingtiles.app', 1096, 594);
  context.textAlign = 'left';

  context.save();
  context.globalCompositeOperation = 'screen';
  const gloss = context.createLinearGradient(0, 22, CARD_WIDTH, 310);
  gloss.addColorStop(0, 'rgba(255, 255, 230, 0.34)');
  gloss.addColorStop(0.28, 'rgba(255, 255, 230, 0.05)');
  gloss.addColorStop(0.5, 'rgba(255, 255, 230, 0.24)');
  gloss.addColorStop(0.74, 'rgba(255, 255, 230, 0.03)');
  gloss.addColorStop(1, 'rgba(255, 255, 230, 0.16)');
  context.fillStyle = gloss;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  context.restore();
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
