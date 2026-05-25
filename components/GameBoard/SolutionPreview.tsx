import { SOLUTION_GRID_BACKGROUND } from './constants';

type SolutionImageProps = {
  columns: number;
  rows: number;
};

type SolutionPreviewProps = SolutionImageProps & {
  isCompact?: boolean;
};

export function SolutionImage({ columns, rows }: SolutionImageProps) {
  return (
    <div
      aria-label="Completed puzzle reference image"
      className="aspect-square overflow-hidden rounded-[7px] border border-foreground/15 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
      role="img"
      style={{
        backgroundImage: SOLUTION_GRID_BACKGROUND,
        backgroundPosition: '0 0, 0 0, center',
        backgroundRepeat: 'repeat, repeat, no-repeat',
        backgroundSize: `calc(100% / ${columns}) 100%, 100% calc(100% / ${rows}), cover`,
      }}
    />
  );
}

export function SolutionPreview({
  columns,
  isCompact = false,
  rows,
}: SolutionPreviewProps) {
  return (
    <figure className="m-0">
      <div className={isCompact ? 'mx-auto w-full max-w-72' : ''}>
        <SolutionImage columns={columns} rows={rows} />
      </div>
    </figure>
  );
}
