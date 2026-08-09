'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { routes, type AppRoute } from '@/lib/routes';

type MainFooterLinkProps = {
  children: ReactNode;
  className?: string;
  href: AppRoute;
};

const baseLinkClass =
  'border-b border-transparent transition-colors hover:border-accent/35 hover:text-accent-strong';
const activeLinkClass = 'border-accent/55 font-semibold text-accent-strong';

function isRouteActive(pathname: string, href: AppRoute) {
  if (href === routes.home) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MainFooterLink({
  children,
  className,
  href,
}: MainFooterLinkProps) {
  const pathname = usePathname();
  const isActive = isRouteActive(pathname, href);

  return (
    <Link
      aria-current={isActive ? 'page' : undefined}
      className={[baseLinkClass, className, isActive ? activeLinkClass : null]
        .filter(Boolean)
        .join(' ')}
      href={href}
    >
      {children}
    </Link>
  );
}
