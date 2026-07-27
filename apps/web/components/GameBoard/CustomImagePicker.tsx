'use client';

import {
  Cloud,
  HardDrive,
  ImageIcon,
  ImagePlus,
  Images,
  Link2,
  X,
} from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  loadStoredPuzzleImages,
  StoredPuzzleImage,
} from '@/lib/puzzleImageStorage';

export type PuzzleImage = {
  blob?: Blob;
  height: number;
  storedId?: string;
  name: string;
  url: string;
  width: number;
};

type CustomImagePickerProps = {
  currentImage: PuzzleImage;
  onClose: () => void;
  onSelect: (image: PuzzleImage) => void;
};

const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_PUZZLE_ASPECT_RATIO = 2.4;
const DEFAULT_PUZZLE_IMAGE: PuzzleImage = {
  height: 1000,
  name: 'Pond frog',
  url: '/frog.svg',
  width: 1000,
};

function normalizeSharedUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Unsupported URL');
  }

  if (url.hostname === 'drive.google.com') {
    const match = url.pathname.match(/\/file\/d\/([^/]+)/);
    const id = match?.[1] ?? url.searchParams.get('id');
    if (id)
      return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;
  }

  if (url.hostname.endsWith('dropbox.com')) {
    url.searchParams.delete('dl');
    url.searchParams.set('raw', '1');
  }

  return url.toString();
}

function loadImage(
  url: string,
  name: string,
  blob?: Blob,
): Promise<PuzzleImage> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error('This image has no usable dimensions.'));
        return;
      }
      resolve({
        blob,
        height: image.naturalHeight,
        name,
        url,
        width: image.naturalWidth,
      });
    };
    image.onerror = () =>
      reject(
        new Error(
          'We could not load that image. Check that the link is public and points to an image.',
        ),
      );
    image.src = url;
  });
}

export function CustomImagePicker({
  currentImage,
  onClose,
  onSelect,
}: CustomImagePickerProps) {
  const [candidate, setCandidate] = useState<PuzzleImage>(currentImage);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavedImagesLoading, setIsSavedImagesLoading] = useState(true);
  const [savedImages, setSavedImages] = useState<
    Array<StoredPuzzleImage & { url: string }>
  >([]);
  const [url, setUrl] = useState('');
  const objectUrlRef = useRef<string | null>(null);
  const savedImageUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) =>
      event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  useEffect(() => {
    let isCancelled = false;

    void loadStoredPuzzleImages()
      .then((images) => {
        if (isCancelled) return;
        const imagesWithUrls = images.map((image) => {
          const imageUrl = URL.createObjectURL(image.blob);
          savedImageUrlsRef.current.push(imageUrl);
          return { ...image, url: imageUrl };
        });
        setSavedImages(imagesWithUrls);
      })
      .catch(() => {
        if (!isCancelled) {
          setError(
            'Your saved images could not be loaded. You can still upload a new one.',
          );
        }
      })
      .finally(() => {
        if (!isCancelled) setIsSavedImagesLoading(false);
      });

    return () => {
      isCancelled = true;
      savedImageUrlsRef.current.forEach((imageUrl) =>
        URL.revokeObjectURL(imageUrl),
      );
      savedImageUrlsRef.current = [];
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const validateUrl = async (sourceUrl: string, name: string) => {
    setError(null);
    setIsLoading(true);
    try {
      setCandidate(await loadImage(sourceUrl, name));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'That image could not be loaded.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(
        'Choose a supported image file, such as JPEG, PNG, WebP, GIF, or HEIC.',
      );
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('That image is larger than 20 MB. Choose a smaller file.');
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = URL.createObjectURL(file);
    setError(null);
    setIsLoading(true);
    void loadImage(objectUrlRef.current, file.name, file)
      .then(setCandidate)
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'That image could not be loaded.',
        );
      })
      .finally(() => setIsLoading(false));
  };

  const rawRatio = candidate.width / candidate.height;
  const willCrop =
    rawRatio > MAX_PUZZLE_ASPECT_RATIO ||
    rawRatio < 1 / MAX_PUZZLE_ASPECT_RATIO;
  const displayRatio = Math.min(
    MAX_PUZZLE_ASPECT_RATIO,
    Math.max(1 / MAX_PUZZLE_ASPECT_RATIO, rawRatio),
  );

  return createPortal(
    <div
      aria-labelledby="image-picker-title"
      aria-modal="true"
      className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-night/80 p-3 backdrop-blur-sm"
      role="dialog"
    >
      <div className="my-auto grid min-w-0 w-full max-w-3xl gap-5 overflow-hidden rounded-xl border border-line bg-panel p-4 shadow-game-shell sm:p-6">
        <header className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase text-accent-strong">
              Create your board
            </p>
            <h2 className="mt-1 text-2xl" id="image-picker-title">
              Choose a photo
            </h2>
            <p className="mt-1 text-sm text-muted">
              Upload from this device or paste a public link from Drive,
              Dropbox, OneDrive, iCloud, or another provider.
            </p>
          </div>
          <button
            aria-label="Close image picker"
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-line text-muted"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid min-w-0 content-start gap-3">
            <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-lg border border-primary bg-primary-soft/50 p-4 font-bold text-accent-strong transition-colors hover:bg-primary-soft">
              <HardDrive className="size-5" />
              <span>
                <span className="block">Upload from device</span>
                <span className="mt-0.5 block text-xs font-normal text-muted">
                  Your system picker also includes connected cloud locations.
                </span>
              </span>
              <input
                accept="image/*"
                className="sr-only"
                onChange={selectFile}
                type="file"
              />
            </label>

            <section
              aria-labelledby="included-images-title"
              className="rounded-lg border border-line p-3"
            >
              <h3
                className="flex items-center gap-2 text-sm font-bold"
                id="included-images-title"
              >
                <ImageIcon className="size-4" /> Included image
              </h3>
              <button
                aria-label="Preview included Pond frog image"
                className="group mt-3 grid w-full grid-cols-[4rem_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-md border border-line bg-surface text-left transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                onClick={() => setCandidate(DEFAULT_PUZZLE_IMAGE)}
                type="button"
              >
                {/* The bundled SVG is also supported by a regular image element. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="aspect-square w-16 bg-night/95 object-cover transition-transform group-hover:scale-105"
                  src={DEFAULT_PUZZLE_IMAGE.url}
                />
                <span className="min-w-0 pr-3">
                  <span className="block truncate text-sm font-bold">
                    {DEFAULT_PUZZLE_IMAGE.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Default puzzle image
                  </span>
                </span>
              </button>
            </section>

            <section
              aria-busy={isSavedImagesLoading}
              aria-labelledby="saved-images-title"
              className="rounded-lg border border-line p-3"
            >
              <h3
                className="flex items-center gap-2 text-sm font-bold"
                id="saved-images-title"
              >
                <Images className="size-4" /> Saved images
              </h3>
              {isSavedImagesLoading ? (
                <p className="mt-3 text-sm text-muted" role="status">
                  Loading saved images…
                </p>
              ) : savedImages.length ? (
                <div className="mt-3 grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 md:grid-cols-3">
                  {savedImages.map((image) => (
                    <button
                      aria-label={`Preview saved image ${image.name}`}
                      className="group overflow-hidden rounded-md border border-line bg-surface text-left transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      key={image.id}
                      onClick={() =>
                        setCandidate({
                          blob: image.blob,
                          height: image.height,
                          name: image.name,
                          storedId: image.id,
                          url: image.url,
                          width: image.width,
                        })
                      }
                      title={image.name}
                      type="button"
                    >
                      {/* IndexedDB blobs need regular img elements and object URLs. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt=""
                        className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                        src={image.url}
                      />
                      <span className="block truncate px-2 py-1.5 text-xs font-bold">
                        {image.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-3 grid justify-items-center rounded-md bg-surface-sunken px-3 py-5 text-center">
                  <ImageIcon className="size-6 text-muted" />
                  <p className="mt-2 text-sm font-bold">No saved images yet</p>
                  <p className="mt-1 text-xs text-muted">
                    Images you upload will appear here.
                  </p>
                </div>
              )}
            </section>

            <div className="rounded-lg border border-line p-3">
              <label
                className="flex items-center gap-2 text-sm font-bold"
                htmlFor="puzzle-image-url"
              >
                <Link2 className="size-4" /> Image or share link
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                  id="puzzle-image-url"
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://…"
                  type="url"
                  value={url}
                />
                <button
                  className="rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-contrast disabled:opacity-50"
                  disabled={!url.trim() || isLoading}
                  onClick={() => {
                    try {
                      const normalized = normalizeSharedUrl(url.trim());
                      void validateUrl(
                        normalized,
                        new URL(url.trim()).hostname,
                      );
                    } catch {
                      setError(
                        'Enter a complete, valid web address beginning with https://.',
                      );
                    }
                  }}
                  type="button"
                >
                  {isLoading ? 'Loading…' : 'Preview'}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-1">
                  <Cloud className="size-3" /> Google Drive
                </span>
                <span className="rounded-full bg-surface-sunken px-2 py-1">
                  Dropbox
                </span>
                <span className="rounded-full bg-surface-sunken px-2 py-1">
                  OneDrive
                </span>
                <span className="rounded-full bg-surface-sunken px-2 py-1">
                  Other providers
                </span>
              </div>
            </div>
            {error ? (
              <p
                aria-live="polite"
                className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-bold text-warning-strong"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>

          <figure className="m-0 grid min-w-0 content-start gap-2">
            <div className="grid min-h-64 place-items-center overflow-hidden rounded-lg bg-night/95 p-3">
              <div
                className="max-h-[50svh] max-w-full overflow-hidden rounded-md shadow-panel"
                style={{
                  aspectRatio: displayRatio,
                  width: displayRatio >= 1 ? '100%' : 'auto',
                  height: displayRatio < 1 ? 'min(50svh, 24rem)' : 'auto',
                }}
              >
                {/* A plain img supports local blobs and arbitrary user-selected providers. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={`Puzzle preview: ${candidate.name}`}
                  className="h-full w-full object-cover"
                  src={candidate.url}
                />
              </div>
            </div>
            <figcaption className="min-w-0 text-sm text-muted">
              <span className="wrap-break-word font-bold text-foreground">
                {candidate.name}
              </span>{' '}
              · {candidate.width}×{candidate.height}
              {willCrop ? (
                <span className="mt-1 block font-bold text-warning-strong">
                  This image is unusually {rawRatio > 1 ? 'wide' : 'tall'}, so
                  its edges will be cropped to fit the supported{' '}
                  {MAX_PUZZLE_ASPECT_RATIO}:1 ratio.
                </span>
              ) : (
                <span className="mt-1 block">
                  The full image and its original aspect ratio will be
                  preserved.
                </span>
              )}
            </figcaption>
          </figure>
        </div>

        <footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-bold"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-contrast"
            onClick={() => {
              const selectedUrl = candidate.blob
                ? URL.createObjectURL(candidate.blob)
                : candidate.url;
              onSelect({ ...candidate, url: selectedUrl });
            }}
            type="button"
          >
            <ImagePlus className="size-4" /> Use this image
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
