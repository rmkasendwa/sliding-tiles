'use client';

import {
  AlertTriangle,
  Check,
  Cloud,
  HardDrive,
  ImageIcon,
  ImagePlus,
  Images,
  Link2,
  Trash2,
  X,
} from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  deleteStoredPuzzleImage,
  importStoredPuzzleImages,
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
  portalContainer?: HTMLElement | null;
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
  portalContainer,
}: CustomImagePickerProps) {
  const [candidate, setCandidate] = useState<PuzzleImage>(currentImage);
  const [error, setError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [imagePendingDeletion, setImagePendingDeletion] = useState<
    (StoredPuzzleImage & { url: string }) | null
  >(null);
  const [isSavedImagesLoading, setIsSavedImagesLoading] = useState(true);
  const [savedImages, setSavedImages] = useState<
    Array<StoredPuzzleImage & { url: string }>
  >([]);
  const [url, setUrl] = useState('');
  const savedImageUrlsRef = useRef<string[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const deleteDialogRef = useRef<HTMLDivElement>(null);
  const deleteCancelButtonRef = useRef<HTMLButtonElement>(null);
  const imagePendingDeletionRef = useRef(imagePendingDeletion);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    imagePendingDeletionRef.current = imagePendingDeletion;
  }, [imagePendingDeletion]);

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (imagePendingDeletionRef.current) {
          setImagePendingDeletion(null);
          return;
        }
        onClose();
        return;
      }

      const activeDialog = imagePendingDeletionRef.current
        ? deleteDialogRef.current
        : dialogRef.current;
      if (event.key !== 'Tab' || !activeDialog) return;

      const focusableElements = Array.from(
        activeDialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          !element.hidden &&
          element.getAttribute('aria-hidden') !== 'true' &&
          element.getClientRects().length > 0,
      );
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements.at(-1);

      if (!firstFocusableElement || !lastFocusableElement) {
        event.preventDefault();
        activeDialog.focus();
      } else if (
        event.shiftKey &&
        document.activeElement === firstFocusableElement
      ) {
        event.preventDefault();
        lastFocusableElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastFocusableElement
      ) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown, true);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      window.removeEventListener('keydown', handleKeyDown, true);
      previouslyFocusedElement?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    if (imagePendingDeletion) {
      deleteCancelButtonRef.current?.focus();
    }
  }, [imagePendingDeletion]);

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

  const selectFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;

    setError(null);
    setImportSummary(null);
    setIsLoading(true);
    let rejectedCount = 0;
    const validImages = [];

    for (const file of files) {
      if (!file.type.startsWith('image/') || file.size > MAX_FILE_BYTES) {
        rejectedCount += 1;
        continue;
      }

      const objectUrl = URL.createObjectURL(file);
      try {
        validImages.push(await loadImage(objectUrl, file.name, file));
      } catch {
        rejectedCount += 1;
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }

    try {
      const { duplicateCount, imported } = await importStoredPuzzleImages(
        validImages.map(({ blob, height, name, width }) => ({
          blob: blob!,
          height,
          name,
          width,
        })),
      );
      const imagesWithUrls = imported.map((image) => {
        const imageUrl = URL.createObjectURL(image.blob);
        savedImageUrlsRef.current.push(imageUrl);
        return { ...image, url: imageUrl };
      });
      if (imagesWithUrls.length) {
        setSavedImages((images) => [...imagesWithUrls, ...images]);
      }

      const parts = [
        `Added ${imported.length} ${imported.length === 1 ? 'image' : 'images'}.`,
      ];
      if (duplicateCount) {
        parts.push(
          `Skipped ${duplicateCount} ${
            duplicateCount === 1 ? 'duplicate' : 'duplicates'
          }.`,
        );
      }
      if (rejectedCount) {
        parts.push(
          `Rejected ${rejectedCount} invalid or unsupported ${
            rejectedCount === 1 ? 'file' : 'files'
          }.`,
        );
      }
      setImportSummary(parts.join(' '));
    } catch {
      setError('The selected images could not be saved. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSavedImage = async (
    image: StoredPuzzleImage & { url: string },
  ) => {
    setError(null);
    setDeletingImageId(image.id);
    try {
      await deleteStoredPuzzleImage(image.id);
      setSavedImages((images) =>
        images.filter((savedImage) => savedImage.id !== image.id),
      );
      savedImageUrlsRef.current = savedImageUrlsRef.current.filter(
        (imageUrl) => imageUrl !== image.url,
      );
      URL.revokeObjectURL(image.url);
      if (candidate.storedId === image.id) {
        setCandidate(DEFAULT_PUZZLE_IMAGE);
      }
      setImagePendingDeletion(null);
    } catch {
      setError('That saved image could not be deleted. Please try again.');
      setImagePendingDeletion(null);
    } finally {
      setDeletingImageId(null);
    }
  };

  const rawRatio = candidate.width / candidate.height;
  const willCrop =
    rawRatio > MAX_PUZZLE_ASPECT_RATIO ||
    rawRatio < 1 / MAX_PUZZLE_ASPECT_RATIO;
  const displayRatio = Math.min(
    MAX_PUZZLE_ASPECT_RATIO,
    Math.max(1 / MAX_PUZZLE_ASPECT_RATIO, rawRatio),
  );
  const savedImagePlaceholderCounts = {
    base: (3 - (savedImages.length % 3)) % 3,
    medium: (3 - (savedImages.length % 3)) % 3,
    small: (4 - (savedImages.length % 4)) % 4,
  };
  const savedImagePlaceholderCount = Math.max(
    savedImagePlaceholderCounts.base,
    savedImagePlaceholderCounts.small,
    savedImagePlaceholderCounts.medium,
  );

  return createPortal(
    <div
      aria-labelledby="image-picker-title"
      aria-modal="true"
      className="fixed inset-0 z-100 grid place-items-center overflow-hidden bg-night/80 p-3 backdrop-blur-sm sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      ref={dialogRef}
      tabIndex={-1}
    >
      <div className="relative grid max-h-[calc(100dvh-1.5rem)] min-w-0 w-full max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-xl border border-line bg-panel shadow-game-shell sm:max-h-[calc(100dvh-4rem)]">
        <header className="flex min-w-0 items-start justify-between gap-4 px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
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
            ref={closeButtonRef}
            type="button"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="grid min-h-0 min-w-0 gap-4 overflow-y-auto overscroll-contain px-4 pt-1 pb-4 sm:px-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
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
                multiple
                onChange={(event) => void selectFiles(event)}
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
                aria-pressed={candidate.url === DEFAULT_PUZZLE_IMAGE.url}
                className={[
                  'group relative mt-3 grid w-full grid-cols-[4rem_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-md border bg-surface text-left transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  candidate.url === DEFAULT_PUZZLE_IMAGE.url
                    ? 'border-accent ring-2 ring-accent/30'
                    : 'border-line',
                ].join(' ')}
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
                {candidate.url === DEFAULT_PUZZLE_IMAGE.url ? (
                  <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-contrast">
                    <Check aria-hidden="true" className="size-3.5" />
                  </span>
                ) : null}
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
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3">
                  {savedImages.map((image) => (
                    <div
                      className={[
                        'group relative overflow-hidden rounded-md border bg-surface transition-colors hover:border-accent',
                        candidate.storedId === image.id
                          ? 'border-accent ring-2 ring-accent/30'
                          : 'border-line',
                      ].join(' ')}
                      key={image.id}
                    >
                      <button
                        aria-label={`Preview saved image ${image.name}`}
                        aria-pressed={candidate.storedId === image.id}
                        className="block w-full text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
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
                        <span className="block truncate px-2 py-1.5 pr-9 text-xs font-bold">
                          {image.name}
                        </span>
                      </button>
                      <button
                        aria-label={`Delete saved image ${image.name}`}
                        className="absolute right-1 bottom-1 grid size-7 place-items-center rounded-md bg-surface/95 text-muted shadow-panel transition-colors hover:bg-warning/15 hover:text-warning-strong focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
                        disabled={deletingImageId === image.id}
                        onClick={() => setImagePendingDeletion(image)}
                        title={`Delete ${image.name}`}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" className="size-3.5" />
                      </button>
                      {candidate.storedId === image.id ? (
                        <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-contrast shadow-panel">
                          <Check aria-hidden="true" className="size-3.5" />
                        </span>
                      ) : null}
                    </div>
                  ))}
                  {Array.from(
                    { length: savedImagePlaceholderCount },
                    (_, index) => (
                      <div
                        aria-hidden="true"
                        className={[
                          index < savedImagePlaceholderCounts.base
                            ? 'block'
                            : 'hidden',
                          index < savedImagePlaceholderCounts.small
                            ? 'sm:block'
                            : 'sm:hidden',
                          index < savedImagePlaceholderCounts.medium
                            ? 'md:block'
                            : 'md:hidden',
                          'overflow-hidden rounded-md border border-dashed border-line/30 bg-surface/10',
                        ].join(' ')}
                        key={`saved-image-placeholder-${index}`}
                      >
                        <div className="grid aspect-square place-items-center bg-line/5">
                          <ImageIcon className="size-5 text-muted/15" />
                        </div>
                        <div className="flex items-center gap-1 px-2 py-2.5">
                          <span className="block h-1.5 w-1/2 rounded-full bg-line/20" />
                          <span className="block size-1.5 rounded-full bg-line/15" />
                          <span className="block h-1.5 w-1/6 rounded-full bg-line/15" />
                        </div>
                      </div>
                    ),
                  )}
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
            {importSummary ? (
              <p
                className="rounded-lg border border-primary/30 bg-primary-soft/50 p-3 text-sm font-bold text-accent-strong"
                role="status"
              >
                {importSummary}
              </p>
            ) : null}
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

        <footer className="flex flex-col-reverse gap-2 border-t border-line bg-panel px-4 pt-3 pb-4 sm:flex-row sm:justify-end sm:px-6 sm:pt-4 sm:pb-6">
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

        {imagePendingDeletion ? (
          <div className="absolute inset-0 z-20 grid place-items-center bg-night/70 p-4 backdrop-blur-[2px] sm:p-6">
            <div
              aria-describedby="delete-image-description"
              aria-labelledby="delete-image-title"
              aria-modal="true"
              className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-panel shadow-game-shell"
              ref={deleteDialogRef}
              role="alertdialog"
              tabIndex={-1}
            >
              <div className="flex items-start gap-4 p-5 sm:p-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-danger/25 bg-danger-soft text-danger">
                  <AlertTriangle aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-danger">
                    Permanent action
                  </p>
                  <h3 className="mt-1 text-xl" id="delete-image-title">
                    Delete this image?
                  </h3>
                  <p
                    className="mt-2 text-sm leading-relaxed text-muted"
                    id="delete-image-description"
                  >
                    It will be removed from your saved images on this browser.
                    This can’t be undone.
                  </p>
                </div>
              </div>

              <div className="mx-5 flex items-center gap-3 rounded-lg border border-line bg-surface-sunken p-2.5 sm:mx-6">
                {/* IndexedDB blobs need regular img elements and object URLs. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="size-12 shrink-0 rounded-md object-cover"
                  src={imagePendingDeletion.url}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">
                    {imagePendingDeletion.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Saved puzzle image
                  </span>
                </span>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 border-t border-line bg-surface/40 p-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  className="rounded-lg border border-line px-4 py-2.5 text-sm font-bold transition-colors hover:bg-surface-sunken"
                  disabled={deletingImageId !== null}
                  onClick={() => setImagePendingDeletion(null)}
                  ref={deleteCancelButtonRef}
                  type="button"
                >
                  Keep image
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  disabled={deletingImageId !== null}
                  onClick={() => void deleteSavedImage(imagePendingDeletion)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  {deletingImageId ? 'Deleting…' : 'Delete image'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    portalContainer ?? document.body,
  );
}
