import Image from 'next/image';

type FrogLogoProps = {
  className?: string;
  variant?: 'color' | 'monochrome';
};

export function FrogLogo({ className = '', variant = 'color' }: FrogLogoProps) {
  const isMonochrome = variant === 'monochrome';

  return (
    <span
      aria-hidden="true"
      className={[
        'relative grid aspect-square place-items-center overflow-hidden rounded-full border',
        isMonochrome
          ? 'border-foreground/15 bg-foreground/5'
          : 'border-accent/25 bg-frog-lime shadow-frog-logo',
        className,
      ].join(' ')}
    >
      <Image
        alt=""
        className={[
          'object-contain p-[8%]',
          isMonochrome ? 'grayscale contrast-125 opacity-70' : '',
        ].join(' ')}
        fill
        priority={false}
        sizes="56px"
        src="/icons/icon-192.png"
      />
    </span>
  );
}
