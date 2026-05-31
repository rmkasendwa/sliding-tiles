export type DisplayableUser = {
  email?: string | null;
  name?: string | null;
  username?: string | null;
};

export function getUserDisplayName(user: DisplayableUser) {
  return user.username || user.name || user.email || 'Player';
}
