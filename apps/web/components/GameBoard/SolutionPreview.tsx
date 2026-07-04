import { SOLUTION_GRID_BACKGROUND } from './constants';

type SolutionImageProps = {
  columns: number;
  imageAspectRatio: number;
  imageUrl: string;
  rows: number;
};

type SolutionPreviewProps = SolutionImageProps & {
  isCompact?: boolean;
};

export function SolutionImage({ columns, imageAspectRatio, imageUrl, rows }: SolutionImageProps) {
  return (
    <div
      aria-label="Completed puzzle reference image"
      className="overflow-hidden rounded-[7px] border border-foreground/15 shadow-solution-preview"
      role="img"
      style={{
        aspectRatio: imageAspectRatio,
        backgroundImage: `${SOLUTION_GRID_BACKGROUND}, url(${JSON.stringify(imageUrl)})`,
        backgroundPosition: '0 0, 0 0, center',
        backgroundRepeat: 'repeat, repeat, no-repeat',
        backgroundSize: `calc(100% / ${columns}) 100%, 100% calc(100% / ${rows}), cover`,
      }}
    />
  );
}

export function SolutionPreview({
  columns,
  imageAspectRatio,
  imageUrl,
  isCompact = false,
  rows,
}: SolutionPreviewProps) {
  return (
    <figure className="m-0">
      <div className={isCompact ? 'mx-auto w-full max-w-72' : ''}>
        <SolutionImage columns={columns} imageAspectRatio={imageAspectRatio} imageUrl={imageUrl} rows={rows} />
      </div>
    </figure>
  );
}
