'use client';

import { useMemo, useState } from 'react';

import { md5 } from '@/lib/hash';

type GravatarDefault =
  | '404'
  | 'mp'
  | 'identicon'
  | 'monsterid'
  | 'wavatar'
  | 'retro'
  | 'robohash'
  | 'blank';

type ProfileAvatarProps = {
  className?: string;
  defaultGravatar?: GravatarDefault;
  email?: string | null;
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

function getGravatarUrl(
  email: string,
  size: number,
  defaultGravatar: GravatarDefault,
) {
  const hash = md5(email.trim().toLowerCase());
  const params = new URLSearchParams({
    d: defaultGravatar,
    s: String(size * 2),
  });

  return `https://www.gravatar.com/avatar/${hash}?${params.toString()}`;
}

export function ProfileAvatar({
  className,
  defaultGravatar = 'blank',
  email,
  name,
  size = 40,
}: ProfileAvatarProps) {
  const [didImageFail, setDidImageFail] = useState(false);
  const gravatarUrl = useMemo(() => {
    if (!email || didImageFail) {
      return null;
    }

    return getGravatarUrl(email, size, defaultGravatar);
  }, [defaultGravatar, didImageFail, email, size]);

  return (
    <span
      aria-label={name}
      className={[
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-accent/25 bg-accent-strong text-sm font-extrabold uppercase text-white shadow-sm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ height: size, width: size }}
    >
      <span aria-hidden="true">{getInitials(name)}</span>
      {gravatarUrl ? (
        // Gravatar is an external user-controlled image; use a plain img so
        // we do not need a project-wide Next image domain for this fallback.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          decoding="async"
          onError={() => setDidImageFail(true)}
          src={gravatarUrl}
        />
      ) : null}
    </span>
  );
}
