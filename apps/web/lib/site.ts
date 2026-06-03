export const siteConfig = {
  contactEmail: 'kasendwaronald@gmail.com',
  copyrightOwner: 'Ronald M. Kasendwa and Sliding Tiles contributors',
  description:
    'Sliding Tiles is a multiplayer puzzle game where players race to solve sliding tile puzzles, improve their solving speed, and climb the leaderboard.',
  foundedYear: 2021,
  githubUrl: 'https://github.com/rmkasendwa/sliding-tiles',
  license: {
    name: 'AGPL-3.0-only',
    url: 'https://www.gnu.org/licenses/agpl-3.0.html',
  },
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
