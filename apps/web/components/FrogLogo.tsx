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

  return (
    <span
      aria-hidden="true"
      className={[
        'relative grid aspect-square place-items-center overflow-hidden rounded-full border',
        isMonochrome
          ? 'border-foreground/15 bg-foreground/5'
          : 'border-accent/25 bg-[#d6f58a] shadow-[inset_0_-5px_10px_rgba(37,111,90,0.24),inset_0_4px_8px_rgba(255,255,255,0.5)]',
        className,
      ].join(' ')}
    >
      <Image
        alt=""
        className={[
          'object-contain p-[8%]',
          isMonochrome
            ? 'grayscale contrast-125 opacity-70 mix-blend-multiply'
            : '',
        ].join(' ')}
        fill
        priority={false}
        sizes="56px"
        src="/logo192.png"
      />
    </span>
  );
}
