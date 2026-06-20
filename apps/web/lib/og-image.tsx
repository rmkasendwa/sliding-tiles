import type { CSSProperties } from 'react';

export const ogImageSize = {
  height: 630,
  width: 1200,
} as const;

type OpenGraphImageProps = {
  description?: string;
  eyebrow?: string;
  tagline?: string;
  title?: string;
};

const tileValues = ['1', '2', '3', '4', '5', '6', '7', '8', ''];
const tileRows = [
  tileValues.slice(0, 3),
  tileValues.slice(3, 6),
  tileValues.slice(6, 9),
];

const styles = {
  background: {
    alignItems: 'stretch',
    background:
      'linear-gradient(135deg, #f8f3e8 0%, #eff7e4 48%, #dceee5 100%)',
    color: '#16231f',
    display: 'flex',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    height: '100%',
    justifyContent: 'center',
    padding: 44,
    width: '100%',
  },
  shell: {
    background: '#0f1d19',
    border: '1px solid rgba(255, 255, 255, 0.22)',
    borderRadius: 34,
    boxShadow: '0 28px 90px rgba(15, 29, 25, 0.26)',
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  glowTop: {
    background: 'rgba(188, 238, 140, 0.22)',
    borderRadius: 999,
    display: 'flex',
    filter: 'blur(6px)',
    height: 240,
    left: 88,
    position: 'absolute',
    top: -120,
    width: 520,
  },
  glowBottom: {
    background: 'rgba(240, 197, 103, 0.16)',
    borderRadius: 999,
    bottom: -160,
    display: 'flex',
    filter: 'blur(4px)',
    height: 280,
    position: 'absolute',
    right: 80,
    width: 440,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-between',
    padding: '66px 0 58px 66px',
    width: 615,
  },
  brandRow: {
    alignItems: 'center',
    display: 'flex',
    gap: 18,
  },
  logo: {
    alignItems: 'center',
    background: '#d7f78e',
    border: '2px solid rgba(255, 255, 255, 0.45)',
    borderRadius: 22,
    boxShadow:
      'inset 0 -8px 14px rgba(37, 111, 90, 0.28), inset 0 7px 12px rgba(255, 255, 255, 0.58)',
    color: '#174f43',
    display: 'flex',
    fontSize: 44,
    fontWeight: 900,
    height: 82,
    justifyContent: 'center',
    width: 82,
  },
  eyebrow: {
    color: '#bdeca0',
    display: 'flex',
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: 0,
    lineHeight: 1.1,
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  title: {
    color: '#fffaf1',
    display: 'flex',
    fontSize: 88,
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 0.94,
    maxWidth: 610,
  },
  tagline: {
    color: '#f0c567',
    display: 'flex',
    fontSize: 38,
    fontWeight: 800,
    letterSpacing: 0,
    lineHeight: 1.1,
  },
  description: {
    color: 'rgba(255, 250, 241, 0.74)',
    display: 'flex',
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: 0,
  },
  visualWrap: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    paddingRight: 62,
    position: 'relative',
  },
  board: {
    background: '#1e3029',
    border: '8px solid rgba(255, 250, 241, 0.16)',
    borderRadius: 28,
    boxShadow:
      '0 30px 70px rgba(0, 0, 0, 0.34), inset 0 2px 0 rgba(255, 255, 255, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    height: 352,
    padding: 16,
    transform: 'rotate(-3deg) translateY(-18px)',
    width: 352,
  },
  tileRow: {
    display: 'flex',
    gap: 12,
  },
  tile: {
    alignItems: 'center',
    background: '#fff6df',
    border: '1px solid rgba(23, 79, 67, 0.12)',
    borderRadius: 20,
    boxShadow:
      'inset 0 -7px 10px rgba(37, 111, 90, 0.16), inset 0 5px 8px rgba(255, 255, 255, 0.72), 0 14px 20px rgba(0, 0, 0, 0.22)',
    color: '#174f43',
    display: 'flex',
    fontSize: 48,
    fontWeight: 900,
    height: 94,
    justifyContent: 'center',
    width: 94,
  },
  emptyTile: {
    background: 'rgba(11, 18, 16, 0.5)',
    border: '1px dashed rgba(255, 250, 241, 0.28)',
    boxShadow: 'inset 0 10px 22px rgba(0, 0, 0, 0.32)',
  },
  accentTile: {
    background: '#d7f78e',
  },
  badge: {
    alignItems: 'center',
    background: '#fffaf1',
    border: '1px solid rgba(23, 79, 67, 0.12)',
    borderRadius: 999,
    bottom: 92,
    boxShadow: '0 18px 42px rgba(0, 0, 0, 0.22)',
    color: '#174f43',
    display: 'flex',
    fontSize: 24,
    fontWeight: 900,
    justifyContent: 'center',
    padding: '16px 24px',
    position: 'absolute',
    right: 112,
    transform: 'rotate(4deg)',
  },
} satisfies Record<string, CSSProperties>;

export function OpenGraphImage({
  description = 'A little pond, a scrambled picture, and one clean path hiding in plain sight.',
  eyebrow = 'Race the board',
  tagline = 'Fast. Simple. Competitive.',
  title = 'Sliding Tiles',
}: OpenGraphImageProps) {
  return (
    <div style={styles.background}>
      <div style={styles.shell}>
        <div style={styles.glowTop} />
        <div style={styles.glowBottom} />

        <div style={styles.content}>
          <div style={styles.brandRow}>
            <div style={styles.logo}>ST</div>
            <div style={styles.eyebrow}>{eyebrow}</div>
          </div>

          <div style={styles.titleGroup}>
            <div style={styles.title}>{title}</div>
            <div style={styles.tagline}>{tagline}</div>
          </div>

          <div style={styles.description}>
            {description}
          </div>
        </div>

        <div style={styles.visualWrap}>
          <div style={styles.board}>
            {tileRows.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} style={styles.tileRow}>
                {row.map((value, tileIndex) => {
                  const isEmpty = value === '';
                  const isAccent = value === '5';

                  return (
                    <div
                      key={`${value || 'empty'}-${rowIndex}-${tileIndex}`}
                      style={{
                        ...styles.tile,
                        ...(isAccent ? styles.accentTile : {}),
                        ...(isEmpty ? styles.emptyTile : {}),
                      }}
                    >
                      {value}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div style={styles.badge}>Puzzle Sprint</div>
        </div>
      </div>
    </div>
  );
}
