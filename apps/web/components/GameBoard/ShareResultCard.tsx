'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';

export type ShareResultCardData = {
  completedAt: string;
  dimensions: [number, number];
  level: number;
  moves: number;
  personalBestLabel: string | null;
  siteDomain?: string;
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

function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  if (context.measureText(text).width <= maxWidth) {
    return text;
  }

  let nextText = text;
  while (
    nextText.length > 1 &&
    context.measureText(`${nextText}...`).width > maxWidth
  ) {
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

function strokeRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: CanvasFillStrokeStyles['strokeStyle'],
  lineWidth: number,
) {
  drawRoundedRect(context, x, y, width, height, radius);
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.stroke();
}

function withShadow(
  context: CanvasRenderingContext2D,
  options: {
    blur: number;
    color: string;
    offsetX?: number;
    offsetY?: number;
  },
  draw: () => void,
) {
  context.save();
  context.shadowBlur = options.blur;
  context.shadowColor = options.color;
  context.shadowOffsetX = options.offsetX ?? 0;
  context.shadowOffsetY = options.offsetY ?? 0;
  draw();
  context.restore();
}

function getShareCardDomain(result: ShareResultCardData) {
  if (result.siteDomain) {
    return result.siteDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.location.host) {
    return window.location.host.replace(/^www\./, '');
  }

  return 'slidingtiles.app';
}

function getSafeDimensions([columns, rows]: [number, number]) {
  return {
    columns: Math.max(2, Math.min(12, Math.trunc(columns))),
    rows: Math.max(2, Math.min(12, Math.trunc(rows))),
  };
}

function drawDimensionBoard(
  context: CanvasRenderingContext2D,
  result: ShareResultCardData,
) {
  const { columns, rows } = getSafeDimensions(result.dimensions);
  const frameMaxWidth = 378;
  const frameMaxHeight = 352;
  const frameAspectRatio = columns / rows;
  const boardWidth =
    frameAspectRatio >= frameMaxWidth / frameMaxHeight
      ? frameMaxWidth
      : frameMaxHeight * frameAspectRatio;
  const boardHeight = boardWidth / frameAspectRatio;
  const boardX = 722 + (frameMaxWidth - boardWidth) / 2;
  const boardY = 110 + (frameMaxHeight - boardHeight) / 2;
  const padding = Math.max(12, Math.min(18, boardWidth * 0.046));
  const gap = Math.max(5, Math.min(12, boardWidth / columns / 8));
  const tileWidth =
    (boardWidth - padding * 2 - gap * (columns - 1)) / columns;
  const tileHeight = (boardHeight - padding * 2 - gap * (rows - 1)) / rows;
  const tileRadius = Math.max(
    6,
    Math.min(20, Math.min(tileWidth, tileHeight) * 0.22),
  );
  const emptyColumn = columns - 1;
  const emptyRow = rows - 1;
  const tileCount = columns * rows;
  const highlightPosition = Math.max(
    1,
    Math.min(tileCount - 2, Math.floor(tileCount / 2)),
  );
  const shouldLabelAllTiles = tileWidth >= 46 && tileHeight >= 42;

  context.save();
  context.translate(boardX + boardWidth / 2, boardY + boardHeight / 2);
  context.rotate(-0.052);
  context.translate(-boardWidth / 2, -boardHeight / 2);
  withShadow(
    context,
    { blur: 42, color: 'rgba(0, 0, 0, 0.36)', offsetY: 24 },
    () =>
      fillRoundedRect(
        context,
        0,
        0,
        boardWidth,
        boardHeight,
        28,
        '#1e3029',
      ),
  );
  strokeRoundedRect(
    context,
    0,
    0,
    boardWidth,
    boardHeight,
    28,
    'rgba(23, 79, 67, 0.18)',
    8,
  );

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const position = row * columns + column + 1;
      const x = padding + column * (tileWidth + gap);
      const y = padding + row * (tileHeight + gap);
      const isEmptySlot = row === emptyRow && column === emptyColumn;
      const isHighlighted = position === highlightPosition;

      if (isEmptySlot) {
        fillRoundedRect(
          context,
          x,
          y,
          tileWidth,
          tileHeight,
          tileRadius,
          'rgba(11, 18, 16, 0.5)',
        );
        strokeRoundedRect(
          context,
          x,
          y,
          tileWidth,
          tileHeight,
          tileRadius,
          'rgba(255, 250, 241, 0.22)',
          2,
        );
        continue;
      }

      const tileGradient = context.createLinearGradient(
        x,
        y,
        x,
        y + tileHeight,
      );
      if (isHighlighted) {
        tileGradient.addColorStop(0, '#e7ffa9');
        tileGradient.addColorStop(1, '#b9ef64');
      } else {
        tileGradient.addColorStop(0, '#fffaf1');
        tileGradient.addColorStop(0.72, '#f3ead2');
        tileGradient.addColorStop(1, '#e7ce8b');
      }
      withShadow(
        context,
        {
          blur: Math.min(16, Math.max(8, tileWidth * 0.18)),
          color: 'rgba(0, 0, 0, 0.2)',
          offsetY: Math.min(10, Math.max(5, tileHeight * 0.12)),
        },
        () =>
          fillRoundedRect(
            context,
            x,
            y,
            tileWidth,
            tileHeight,
            tileRadius,
            tileGradient,
          ),
      );

      const shouldLabelTile =
        shouldLabelAllTiles ||
        position <= 3 ||
        position === highlightPosition ||
        position === tileCount - 1;

      if (shouldLabelTile) {
        const label = String(position);
        const fontSize = Math.max(
          14,
          Math.min(48, Math.min(tileWidth, tileHeight) * 0.48),
        );
        context.fillStyle = '#174f43';
        context.font = `800 ${fontSize}px ${FONT_STACK}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(label, x + tileWidth / 2, y + tileHeight / 2 + 1);
        context.textAlign = 'start';
        context.textBaseline = 'alphabetic';
      }
    }
  }

  context.restore();

  const dimensionBadgeWidth = 112;
  const dimensionBadgeHeight = 42;
  const dimensionBadgeX = boardX + boardWidth - dimensionBadgeWidth + 10;
  const dimensionBadgeY = boardY - 14;
  withShadow(
    context,
    { blur: 18, color: 'rgba(0, 0, 0, 0.22)', offsetY: 10 },
    () => {
      const dimensionGradient = context.createLinearGradient(
        dimensionBadgeX,
        dimensionBadgeY,
        dimensionBadgeX + dimensionBadgeWidth,
        dimensionBadgeY + dimensionBadgeHeight,
      );
      dimensionGradient.addColorStop(0, '#fffaf1');
      dimensionGradient.addColorStop(0.58, '#d7f78e');
      dimensionGradient.addColorStop(1, '#f0c567');
      fillRoundedRect(
        context,
        dimensionBadgeX,
        dimensionBadgeY,
        dimensionBadgeWidth,
        dimensionBadgeHeight,
        999,
        dimensionGradient,
      );
    },
  );
  strokeRoundedRect(
    context,
    dimensionBadgeX,
    dimensionBadgeY,
    dimensionBadgeWidth,
    dimensionBadgeHeight,
    999,
    'rgba(255, 250, 241, 0.62)',
    2,
  );
  context.fillStyle = '#174f43';
  context.font = `900 20px ${FONT_STACK}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(
    `${columns}x${rows}`,
    dimensionBadgeX + dimensionBadgeWidth / 2,
    dimensionBadgeY + dimensionBadgeHeight / 2 + 1,
  );
  context.textAlign = 'start';
  context.textBaseline = 'alphabetic';
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
  const siteDomain = getShareCardDomain(result);

  context.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const backdropGradient = context.createLinearGradient(
    0,
    0,
    CARD_WIDTH,
    CARD_HEIGHT,
  );
  backdropGradient.addColorStop(0, '#0d4037');
  backdropGradient.addColorStop(0.52, '#10231f');
  backdropGradient.addColorStop(1, '#2e4e32');
  context.fillStyle = backdropGradient;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  context.save();
  context.globalAlpha = 0.16;
  context.strokeStyle = '#bdeca0';
  context.lineWidth = 2;
  for (let x = -190; x < CARD_WIDTH + 220; x += 78) {
    context.beginPath();
    context.moveTo(x, -20);
    context.lineTo(x + 240, CARD_HEIGHT + 20);
    context.stroke();
  }
  context.globalAlpha = 0.11;
  context.strokeStyle = '#fff3b5';
  for (let y = 56; y < CARD_HEIGHT + 120; y += 96) {
    context.beginPath();
    context.moveTo(-50, y);
    context.lineTo(CARD_WIDTH + 50, y - 148);
    context.stroke();
  }
  context.restore();

  const shellGradient = context.createLinearGradient(44, 44, 1156, 586);
  shellGradient.addColorStop(0, '#fffaf1');
  shellGradient.addColorStop(0.5, '#eff7e4');
  shellGradient.addColorStop(1, '#f4e3b6');
  withShadow(
    context,
    { blur: 80, color: 'rgba(70, 45, 11, 0.28)', offsetY: 24 },
    () => fillRoundedRect(context, 56, 44, 1088, 500, 34, shellGradient),
  );

  context.save();
  drawRoundedRect(context, 56, 44, 1088, 500, 34);
  context.clip();

  const topGlow = context.createRadialGradient(270, 40, 20, 270, 40, 430);
  topGlow.addColorStop(0, 'rgba(255, 246, 177, 0.58)');
  topGlow.addColorStop(1, 'rgba(255, 246, 177, 0)');
  context.fillStyle = topGlow;
  context.fillRect(56, 44, 1088, 500);

  const goldGlow = context.createRadialGradient(1030, 540, 30, 1030, 540, 380);
  goldGlow.addColorStop(0, 'rgba(240, 197, 103, 0.3)');
  goldGlow.addColorStop(1, 'rgba(240, 197, 103, 0)');
  context.fillStyle = goldGlow;
  context.fillRect(56, 44, 1088, 500);

  const brushedGold = context.createLinearGradient(80, 88, 1120, 532);
  brushedGold.addColorStop(0, 'rgba(255, 247, 190, 0.32)');
  brushedGold.addColorStop(0.5, 'rgba(255, 235, 143, 0.14)');
  brushedGold.addColorStop(1, 'rgba(196, 129, 31, 0.18)');
  context.save();
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = brushedGold;
  context.fillRect(56, 44, 1088, 500);
  context.restore();

  context.restore();

  const goldStroke = context.createLinearGradient(56, 56, 1144, 574);
  goldStroke.addColorStop(0, '#fff4b8');
  goldStroke.addColorStop(0.24, '#d9a13a');
  goldStroke.addColorStop(0.52, '#fff7c5');
  goldStroke.addColorStop(0.78, '#b7781f');
  goldStroke.addColorStop(1, '#f6d981');
  strokeRoundedRect(context, 56, 44, 1088, 500, 34, goldStroke, 4);
  strokeRoundedRect(
    context,
    80,
    70,
    1038,
    446,
    26,
    'rgba(23, 79, 67, 0.18)',
    2,
  );

  const brandGradient = context.createLinearGradient(112, 102, 194, 184);
  brandGradient.addColorStop(0, '#fff7c4');
  brandGradient.addColorStop(0.34, '#f0c567');
  brandGradient.addColorStop(0.68, '#d7f78e');
  brandGradient.addColorStop(1, '#8bc15f');
  withShadow(
    context,
    { blur: 22, color: 'rgba(240, 197, 103, 0.28)', offsetY: 8 },
    () => fillRoundedRect(context, 112, 104, 82, 82, 22, brandGradient),
  );
  strokeRoundedRect(
    context,
    112,
    104,
    82,
    82,
    22,
    'rgba(255, 255, 255, 0.52)',
    2,
  );
  context.fillStyle = '#174f43';
  context.font = `800 42px ${FONT_STACK}`;
  context.fillText('ST', 128, 158);

  context.fillStyle = '#174f43';
  context.font = `800 24px ${FONT_STACK}`;
  context.fillText('Sliding Tiles', 216, 146);

  context.fillStyle = 'rgba(23, 79, 67, 0.64)';
  context.font = `800 18px ${FONT_STACK}`;
  context.fillText(serial, 216, 176);

  const victoryGradient = context.createLinearGradient(112, 224, 612, 344);
  victoryGradient.addColorStop(0, '#09221d');
  victoryGradient.addColorStop(0.58, '#174f43');
  victoryGradient.addColorStop(1, '#8a621c');
  context.fillStyle = victoryGradient;
  context.font = `900 88px ${FONT_STACK}`;
  context.fillText(`Level ${result.level}`, 112, 318);

  context.fillStyle = '#8a621c';
  context.font = `800 38px ${FONT_STACK}`;
  context.fillText('Puzzle solved clean.', 116, 380);

  context.fillStyle = 'rgba(23, 79, 67, 0.72)';
  context.font = `700 26px ${FONT_STACK}`;
  context.fillText(fitText(context, badgeText, 520), 116, 430);

  drawDimensionBoard(context, result);

  const badgeX = 856;
  const badgeY = 424;
  withShadow(
    context,
    { blur: 28, color: 'rgba(0, 0, 0, 0.24)', offsetY: 16 },
    () => {
      const badgeGradient = context.createLinearGradient(
        badgeX,
        badgeY,
        badgeX + 216,
        badgeY + 58,
      );
      badgeGradient.addColorStop(0, '#fffaf1');
      badgeGradient.addColorStop(0.55, '#f0c567');
      badgeGradient.addColorStop(1, '#fff3b1');
      fillRoundedRect(context, badgeX, badgeY, 216, 58, 999, badgeGradient);
    },
  );
  strokeRoundedRect(
    context,
    badgeX,
    badgeY,
    216,
    58,
    999,
    'rgba(255, 250, 241, 0.58)',
    2,
  );
  context.fillStyle = '#174f43';
  context.font = `900 24px ${FONT_STACK}`;
  context.fillText('Victory Card', badgeX + 28, badgeY + 38);

  const stats = [
    ['Time', result.timeLabel],
    ['Moves', String(result.moves)],
    ['Completed', completedDate],
  ] as const;
  stats.forEach(([label, value], index) => {
    const width = index === 2 ? 248 : 142;
    const x = index === 0 ? 112 : index === 1 ? 286 : 460;
    const y = 438;
    const statGradient = context.createLinearGradient(x, y, x + width, y + 70);
    statGradient.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
    statGradient.addColorStop(1, 'rgba(240, 197, 103, 0.16)');
    fillRoundedRect(context, x, y, width, 64, 18, statGradient);
    strokeRoundedRect(context, x, y, width, 64, 18, 'rgba(23, 79, 67, 0.1)', 1);
    context.fillStyle = '#66716a';
    context.font = `800 14px ${FONT_STACK}`;
    context.fillText(label.toUpperCase(), x + 16, y + 24);
    context.fillStyle = '#174f43';
    context.font = `900 24px ${FONT_STACK}`;
    context.fillText(fitText(context, value, width - 32), x + 16, y + 51);
  });

  context.fillStyle = 'rgba(189, 236, 160, 0.5)';
  context.font = `900 22px ${FONT_STACK}`;
  context.fillText(siteDomain, 112, 574);
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
    <div className="absolute inset-0 z-60 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
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
          className="mt-4 block aspect-1200/630 w-full rounded-md border border-line bg-background"
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
        'block aspect-1200/630 w-full rounded-lg bg-background shadow-panel',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      ref={canvasRef}
    />
  );
}
