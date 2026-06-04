import Image from 'next/image';

type FrogLogoProps = {
  className?: string;
  variant?: 'color' | 'monochrome';
};

export function FrogLogo({
  className = '',
  variant = 'color',
}: FrogLogoProps) {
  const isMonochrome = variant === 'monochrome';

  if (isMonochrome) {
    return (
      <span
        aria-hidden="true"
        className={[
          'relative grid aspect-square place-items-center overflow-hidden rounded-full border border-line bg-surface-raised text-foreground/80 shadow-inset-highlight',
          className,
        ].join(' ')}
      >
        <span
          className="h-[84%] w-[84%] bg-current"
          style={{
            WebkitMask:
              "url('/logo192.png') center / contain no-repeat",
            mask: "url('/logo192.png') center / contain no-repeat",
          }}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={[
        'relative grid aspect-square place-items-center overflow-hidden rounded-full border',
        'border-accent/25 bg-frog-lime shadow-frog-logo',
        className,
      ].join(' ')}
    >
      <Image
        alt=""
        className="object-contain p-[8%]"
        fill
        priority={false}
        sizes="56px"
        src="/logo192.png"
      />
    </span>
  );
}
