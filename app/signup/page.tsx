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
    <section className="shell page auth-layout">
      <AuthForm mode="signup" />
      <p className="notice" style={{ marginTop: 16, textAlign: 'center' }}>
        Already have an account? <Link href="/login">Log in</Link>.
      </p>
    </section>
  );
}
