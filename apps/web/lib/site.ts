export const siteConfig = {
  contactEmail: 'kasendwaronald@gmail.com',
  description:
    'Sliding Tiles is a multiplayer puzzle game where players race to solve sliding tile puzzles, improve their solving speed, and climb the leaderboard.',
  foundedYear: 2021,
  githubUrl: 'https://github.com/rmkasendwa/sliding-tiles',
  name: 'Sliding Tiles',
  tagline: 'Fast. Simple. Competitive.',
} as const;

export function formatCopyright({
  currentYear = new Date().getFullYear(),
  foundedYear = siteConfig.foundedYear,
  siteName = siteConfig.name,
}: {
  currentYear?: number;
  foundedYear?: number;
  siteName?: string;
} = {}) {
  const safeCurrentYear = Math.max(currentYear, foundedYear);
  const yearText =
    safeCurrentYear === foundedYear
      ? String(foundedYear)
      : `${foundedYear}-${safeCurrentYear}`;

  return `© ${yearText} ${siteName}`;
}
