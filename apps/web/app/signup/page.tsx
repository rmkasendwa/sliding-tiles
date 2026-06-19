import { redirect } from 'next/navigation';

import { getSafeReturnTo } from '@/lib/authRedirect';
import { routes } from '@/lib/routes';

type LegacyRegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyRegisterPage({
  searchParams,
}: LegacyRegisterPageProps) {
  const params = (await searchParams) ?? {};
  const rawReturnTo = params.returnTo;
  const returnTo = Array.isArray(rawReturnTo) ? rawReturnTo[0] : rawReturnTo;

  if (returnTo) {
    const query = new URLSearchParams({
      returnTo: getSafeReturnTo(returnTo),
    });
    redirect(`${routes.register}?${query}`);
  }

  redirect(routes.register);
}
