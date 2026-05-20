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
    <section className="shell page auth-layout">
      <AuthForm mode="login" />
      <p className="notice" style={{ marginTop: 16, textAlign: 'center' }}>
        No account yet? <Link href="/signup">Create one</Link>.
      </p>
    </section>
  );
}
