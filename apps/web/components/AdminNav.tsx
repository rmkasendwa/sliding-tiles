'use client';

import { BarChart3, ListFilter, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { routes, type AppRoute } from '@/lib/routes';

const navItems = [
  { href: routes.adminAnalytics, icon: BarChart3, label: 'Analytics' },
  { href: routes.adminEvents, icon: ListFilter, label: 'Events' },
  { href: routes.adminUsers, icon: Users, label: 'Users' },
];

function isRouteActive(pathname: string, href: AppRoute) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Admin navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = isRouteActive(pathname, item.href);
        return (
          <Link
            aria-current={isActive ? 'page' : undefined}
            className={[
              'inline-flex min-h-10 items-center justify-center gap-2 rounded-[7px] border px-3 text-sm font-bold shadow-sm transition',
              isActive
                ? 'border-accent bg-accent/10 text-accent-strong ring-2 ring-accent/35'
                : 'border-line bg-panel text-foreground hover:border-accent/50 hover:text-accent-strong',
            ].join(' ')}
            href={item.href}
            key={item.href}
          >
            <Icon aria-hidden="true" className="size-4" strokeWidth={2.2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
