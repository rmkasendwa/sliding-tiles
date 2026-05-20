import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="shell page hero">
      <div className="hero-copy">
        <p className="eyebrow">Modernized puzzle engine</p>
        <h1>Sliding Tiles</h1>
        <p className="lead">
          Play anonymously for a quick run, or create an account to save your
          board and compete on the leaderboard.
        </p>
        <div className="actions">
          <Link className="button" href="/play">
            Start playing
          </Link>
          <Link className="button secondary" href="/leaderboard">
            View leaderboard
          </Link>
        </div>
      </div>
      <div className="panel hero-preview" aria-hidden="true">
        <div className="mini-board">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              className={`mini-tile ${index === 8 ? 'empty' : ''}`}
              key={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
