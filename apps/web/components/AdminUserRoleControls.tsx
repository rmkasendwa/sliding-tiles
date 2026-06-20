'use client';

import { Shield, ShieldOff } from 'lucide-react';
import { useTransition } from 'react';

import { updateUserRole } from '@/app/actions/admin';
import type { AdminUser } from '@/lib/api';

export function AdminUserRoleControls({ user }: { user: AdminUser }) {
  const [isPending, startTransition] = useTransition();
  const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
  const actionLabel = user.role === 'ADMIN' ? 'Demote' : 'Promote';
  const Icon = user.role === 'ADMIN' ? ShieldOff : Shield;

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[7px] border border-line bg-panel px-3 text-sm font-bold text-foreground shadow-sm transition hover:border-accent/50 hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-55"
      disabled={isPending}
      onClick={() => {
        const confirmed = window.confirm(
          `${actionLabel} ${user.email} ${nextRole === 'ADMIN' ? 'to admin' : 'back to user'}?`,
        );
        if (!confirmed) {
          return;
        }

        const formData = new FormData();
        formData.set('userId', user.id);
        formData.set('role', nextRole);
        startTransition(() => {
          void updateUserRole(formData);
        });
      }}
      type="button"
    >
      <Icon aria-hidden="true" className="size-4" strokeWidth={2.2} />
      {isPending ? 'Saving' : actionLabel}
    </button>
  );
}
