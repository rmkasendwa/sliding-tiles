import { createHash } from 'crypto';

export function getGravatarUrl(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const hash = createHash('md5').update(normalizedEmail).digest('hex');

  return `https://www.gravatar.com/avatar/${hash}?d=blank`;
}
