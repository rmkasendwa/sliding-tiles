import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthForm } from '@/components/auth-form';
import { getSession } from '@/lib/session';

export default async function SignupPage() {
  const session = await getSession();
  if (session) {
    redirect('/play');
  }

  return (
    <section className="mx-auto my-9 w-[min(460px,100%)] px-4 py-11 pb-14">
      <AuthForm mode="signup" />
      <p className="mt-4 text-center leading-normal text-muted">
        Already have an account? <Link href="/login">Log in</Link>.
      </p>
    </section>
  );
}
