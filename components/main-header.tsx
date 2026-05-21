import { logout } from '@/app/actions/auth';
import { getSession } from '@/lib/session';

import { MainHeaderNav } from './main-header-nav';

export async function MainHeader() {
  const session = await getSession();

  return <MainHeaderNav logout={logout} session={session} />;
}
