import { Search, ShieldCheck, UserRound } from 'lucide-react';

import { AdminUserRoleControls } from '@/components/AdminUserRoleControls';
import type { AdminUsersResponse } from '@/lib/api';
import { apiRequest } from '@/lib/api';

type AdminUsersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const params = (await searchParams) ?? {};
  const search = getParam(params.search)?.trim() ?? '';
  const query = new URLSearchParams({ take: '50' });
  if (search) {
    query.set('search', search);
  }

  const { users, totalCount } = await apiRequest<AdminUsersResponse>(
    `/admin/users?${query}`,
  );

  return (
    <div className="grid gap-5">
      <form
        action="/admin/users"
        className="grid gap-3 rounded-lg border border-line bg-surface p-4 shadow-panel min-[720px]:grid-cols-[minmax(0,1fr)_auto] min-[720px]:items-end"
      >
        <label className="grid gap-2 text-sm font-bold text-foreground">
          Search users by email
          <span className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            />
            <input
              className="min-h-11 w-full rounded-[7px] border border-line bg-panel px-10 text-base text-foreground outline-none transition focus:border-accent"
              defaultValue={search}
              name="search"
              placeholder="player@example.com"
              type="search"
            />
          </span>
        </label>
        <button className="inline-flex min-h-11 items-center justify-center rounded-[7px] border border-primary bg-primary px-5 text-sm font-bold text-primary-contrast shadow-button-primary transition hover:bg-primary-strong">
          Search
        </button>
      </form>

      <section className="overflow-hidden rounded-lg border border-line bg-surface shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <h2 className="text-xl leading-tight">Registered Users</h2>
            <p className="text-sm text-muted">{totalCount} matching users</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="bg-panel text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Promoted By</th>
                <th className="px-4 py-3">Promoted At</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((user) => {
                const RoleIcon = user.role === 'ADMIN' ? ShieldCheck : UserRound;
                return (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <div className="grid gap-1">
                        <span className="font-bold text-foreground">
                          {user.name}
                        </span>
                        <span className="text-muted">{user.email}</span>
                        <span className="text-xs text-muted">
                          @{user.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs font-extrabold uppercase text-foreground">
                        <RoleIcon
                          aria-hidden="true"
                          className="size-4"
                          strokeWidth={2.2}
                        />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {user.promotedBy ? user.promotedBy.email : 'Not recorded'}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDateTime(user.promotedAt)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AdminUserRoleControls user={user} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
