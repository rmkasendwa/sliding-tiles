import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthForm } from '@/components/AuthForm';
import { routes } from '@/lib/routes';
import { getSession } from '@/lib/session';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(routes.play);
  }

  return (
    <section className="mx-auto my-9 w-[min(460px,100%)] px-4 py-11 pb-14">
      <AuthForm mode="login" />
      <p className="mt-4 text-center leading-normal text-muted">
        No account yet? <Link href={routes.signup}>Create one</Link>.
      </p>
    </section>
  );
}
