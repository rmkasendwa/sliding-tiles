import { BarChart3, LayoutDashboard, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { routes } from '@/lib/routes';
import { getSession } from '@/lib/session';

const navItems = [
  { href: routes.admin, icon: LayoutDashboard, label: 'Overview' },
  { href: routes.adminAnalytics, icon: BarChart3, label: 'Analytics' },
  { href: routes.adminUsers, icon: Users, label: 'Users' },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (session?.role !== 'ADMIN') {
    notFound();
  }

  return (
    <section className="page-rail mx-auto grid max-w-300 gap-5 py-5">
      <header className="grid gap-4 border-b border-line pb-4 min-[760px]:grid-cols-[minmax(0,1fr)_auto] min-[760px]:items-end">
        <div className="grid gap-2">
          <p className="text-xs font-extrabold uppercase text-accent-strong">
            Admin
          </p>
          <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-tight">
            Sliding Tiles Ops
          </h1>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[7px] border border-line bg-panel px-3 text-sm font-bold text-foreground shadow-sm transition hover:border-accent/50 hover:text-accent-strong"
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden="true" className="size-4" strokeWidth={2.2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </section>
  );
}
