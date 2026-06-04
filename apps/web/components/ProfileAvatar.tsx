'use client';

import { useMemo, useState } from 'react';

type ProfileAvatarProps = {
  avatarUrl?: string | null;
  className?: string;
  name: string;
  size?: number;
};

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return 'U';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

function withGravatarSize(avatarUrl: string, size: number) {
  const url = new URL(avatarUrl);
  url.searchParams.set('s', String(size * 2));
  return url.toString();
}

export function ProfileAvatar({
  avatarUrl,
  className,
  name,
  size = 40,
}: ProfileAvatarProps) {
  const [didImageFail, setDidImageFail] = useState(false);
  const sizedAvatarUrl = useMemo(() => {
    if (!avatarUrl || didImageFail) {
      return null;
    }

    return withGravatarSize(avatarUrl, size);
  }, [avatarUrl, didImageFail, size]);

  return (
    <span
      aria-label={name}
      className={[
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-primary/35 bg-primary text-sm font-extrabold uppercase text-primary-contrast shadow-sm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ height: size, width: size }}
    >
      <span aria-hidden="true">{getInitials(name)}</span>
      {sizedAvatarUrl ? (
        // Gravatar is an external user-controlled image; use a plain img so
        // we do not need a project-wide Next image domain for this fallback.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          decoding="async"
          onError={() => setDidImageFail(true)}
          src={sizedAvatarUrl}
        />
      ) : null}
    </span>
  );
}
