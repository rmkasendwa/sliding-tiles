import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthForm } from '@/components/auth-form';
import { getSession } from '@/lib/session';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect('/play');
  }

  return (
    <section className="mx-auto my-9 w-[min(460px,100%)] px-4 py-11 pb-14">
      <AuthForm mode="login" />
      <p className="mt-4 text-center leading-normal text-muted">
        No account yet? <Link href="/signup">Create one</Link>.
      </p>
    </section>
  );
}
