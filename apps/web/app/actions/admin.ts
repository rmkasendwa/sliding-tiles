'use server';

import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';

import { apiRequest } from '@/lib/api';
import { routes } from '@/lib/routes';
import { getSession } from '@/lib/session';

async function requireAdmin() {
  const session = await getSession();
  if (session?.role !== 'ADMIN') {
    notFound();
  }

  return session;
}

export async function updateUserRole(formData: FormData) {
  await requireAdmin();

  const userId = formData.get('userId')?.toString();
  const role = formData.get('role')?.toString();
  if (!userId || (role !== 'USER' && role !== 'ADMIN')) {
    return;
  }

  await apiRequest(`/admin/users/${userId}/role`, {
    body: { role },
    method: 'PATCH',
  });

  revalidatePath(routes.adminUsers);
}
