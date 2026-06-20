import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { AdminNav } from '@/components/AdminNav';
import { getSession } from '@/lib/session';

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
        <AdminNav />
      </header>
      {children}
    </section>
  );
}
