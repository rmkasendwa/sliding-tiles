# Contributing

Thanks for helping improve Sliding Tiles. This project has explicit repo
conventions, licensing expectations, and community standards. Follow these
rules before opening a PR or pushing directly.

## How to Contribute

1. Fork or branch from the current main development branch.
2. Keep changes focused on one objective.
3. Follow the setup instructions in [README.md](README.md).
4. Run the required quality checks before submitting work.
5. Open a pull request with a short summary of what changed and why.

For bugs, include reproduction steps. For UI changes, include enough detail for
reviewers to understand the affected screen and interaction.

## Code of Conduct Expectations

Sliding Tiles does not currently maintain a separate Code of Conduct document,
so these expectations apply by default:

- Be respectful and constructive.
- Assume good intent, especially during review.
- Critique code and behavior, not people.
- Avoid harassment, personal attacks, discriminatory language, or hostile
  conduct.
- Keep competitive gameplay discussions fair and honest.

Maintainers may remove comments, reject contributions, or limit participation
when behavior makes collaboration harder or less welcoming.

## Licensing and Contribution Ownership

Sliding Tiles project-owned code is licensed under **AGPL-3.0-only**. See
[LICENSE](LICENSE) and [docs/licensing.md](docs/licensing.md).

By contributing, you agree that your contribution is licensed under
AGPL-3.0-only, the same license as the project-owned code. You retain copyright
in your contribution unless a separate written agreement says otherwise.

The project does not currently use a Contributor License Agreement. That keeps
contribution lightweight, but it also means future relicensing may require
consent from affected contributors.

Do not contribute code, assets, sounds, images, or text unless you have the
right to license them under the applicable project terms. Third-party material
must include clear attribution and license information.

## 1) Naming Conventions

### Database (Required)

- Use plural snake_case table names.
- Use snake_case column names.
- Keep Prisma model/field names idiomatic in code, and map DB names with `@@map` and `@map`.
- If adding or renaming DB structures, prefer data-safe rename migrations over drop/recreate.

Examples:

- Tables: `users`, `game_states`, `leaderboards`
- Columns: `user_id`, `password_hash`, `time_seconds`, `completed_at`

### Code

- TypeScript symbols: `camelCase` for variables/functions, `PascalCase` for components/types.
- Classes must use `PascalCase`.
- JSON API properties must use `camelCase`.
- Keep public API payload shapes stable unless a change is intentional and documented.

## 2) Commit Message Rule

- Commit message style must be a single line.
- It must still include concrete detail about what changed.
- Do not use generic messages like `fix`, `update`, or `misc changes`.

Good examples:

- `Enhance leaderboard with hero panel, featured top run card, and responsive podium`
- `Adopt snake_case DB columns via Prisma mappings and safe rename migrations`

## 3) Migration Rule

- Never perform destructive schema resets for routine renames.
- Prefer `ALTER TABLE ... RENAME` and constraint/index renames.
- Keep Prisma schema and migration SQL aligned.
- Run `npm run db:generate` after schema changes.

## 4) Quality Gate Before Commit

Run all checks and ensure they pass:

```bash
npm run typecheck
npm run lint
```

For Prisma changes also run:

```bash
npm run db:generate
```

## 5) UI/UX Direction

- Prefer intentional, distinctive UI over generic boilerplate layouts.
- Use available screen real estate thoughtfully.
- Keep desktop and mobile experiences both first-class.

## 6) Audio + Board Architecture

- Keep board audio scoped to board instances, not app-global by default.
- Preserve embeddable-board friendliness when adding features.
- Any new sound behavior should not leak to non-board routes.

## 7) Scope Discipline

- Keep changes focused on the requested task.
- Avoid unrelated refactors in the same commit.
- If a larger refactor is required, split into separate commits.

## 8) Documentation Rule

When introducing a new convention:

- Update this file.
- If user-facing behavior changes, also update `README.md` where relevant.

## 9) Common Default Rules (Editable)

Use these as the default baseline unless the repo owner says otherwise.

### Pull Request Hygiene

- Keep PRs small and focused on one objective.
- Include a short summary of what changed and why.
- Mention any schema, API, or behavior changes explicitly.

### Testing Expectations

- Add or update tests when business logic changes.
- Verify changed flows manually if automated coverage is missing.
- Do not merge known failing checks without explicit approval.

### API and Contract Safety

- Preserve backwards compatibility where possible.
- If contract changes are required, update callers in the same change.
- Keep error payload shape consistent unless migration is planned.

### Security and Secrets

- Never commit secrets, keys, or tokens.
- Validate auth and authorization paths for any protected endpoint changes.
- Avoid exposing internal errors or sensitive data to clients.

### Accessibility and UX

- Ensure interactive elements are keyboard accessible.
- Add meaningful labels for controls and forms.
- Keep contrast and readability acceptable on small and large screens.

### Performance and Reliability

- Avoid unnecessary rerenders, repeated requests, or N+1 queries.
- Prefer safe incremental migrations over destructive operations.
- Use pagination/limits when loading potentially large datasets.

### Code Style and Maintainability

- Prefer clear naming and predictable structure over clever shortcuts.
- Remove dead code and unused imports in touched areas.
- Leave concise comments only where logic is not obvious.
