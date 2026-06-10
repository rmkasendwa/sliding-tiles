import { logout } from '@/app/actions/auth';
import type { SessionUser } from '@/lib/session';

import { MainHeaderNav } from './MainHeaderNav';

export function MainHeader({ session }: { session: SessionUser | null }) {
  return <MainHeaderNav logout={logout} session={session} />;
}
