import type { ImgHTMLAttributes } from 'react';

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  fill?: boolean;
  priority?: boolean;
  src: string | { src: string };
};

export default function Image({ fill, priority, src, style, ...props }: ImageProps) {
  const resolvedSrc = typeof src === 'string' ? src : src.src;

  return (
    <img
      {...props}
      src={resolvedSrc}
      style={{
        ...(fill
          ? {
              height: '100%',
              inset: 0,
              position: 'absolute',
              width: '100%',
            }
          : null),
        ...style,
      }}
    />
  );
}
