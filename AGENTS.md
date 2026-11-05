# Agent instructions: claude-harness-generic

A bare-bones AI working harness kit. An AI on another account reads [SETUP.md](SETUP.md) and sets up a project with it in three rounds of owner-run commands. It is cut down from AI-Master-Instructions; [docs/PORTING.md](docs/PORTING.md) maps the two. Current state: [HANDOFF.md](HANDOFF.md). The rules in `core/rules/` apply here too (CLAUDE.md imports them).

## Layout

- `core/rules/`: the rules a project copies to `.harness/rules/`. One topic per file, one id prefix per file, file order in `kit.json`.
- `core/templates/`: AGENTS, CLAUDE, HANDOFF, DECISIONS, LESSONS, gitignore, gitattributes. `{{NAME}}` values are filled by init; `{{FILL: ...}}` placeholders are left for the setting-up agent, and `doctor` lists them.
- `scripts/harness.mjs`: the only script. No dependencies, Node 18+, Windows and POSIX. init copies it into projects, so it has to work there unchanged.
- `tests/`: `node --test`.

## The bar for a change

- A rule traces to a real mistake or a measured saving, cited in its `<!-- why: ... | source: ... -->` line. Ideas that don't meet the bar go to [candidates/CANDIDATES.md](candidates/CANDIDATES.md).
- Ids are stable. Retire a rule with `SUPERSEDED by <id>: <reason>`; never delete or renumber one.
- Keep the kit generic: no project facts, people, connectors or cloud-only features (SRC-03).
- The rendered rules plus the AGENTS and CLAUDE templates must leave 40 lines and 4 KB of the 200-line, 24 KB start-up budget for the project. `check` enforces this.
- Every behaviour of `harness.mjs` has a test. Output stays short, because owners paste it back.

## Local checks (run before pushing)

- `node scripts/harness.mjs check && node --test`

CI (`.github/workflows/check.yml`) runs the same on every non-draft PR and every push to `main`.

## Releasing

Add a CHANGELOG entry and bump `kit.json` `version` together (`check` compares them): a patch for wording, a minor version for new rules or features, and a major version for removed or tightened rules or a changed file layout. Record design changes in [decisions/DECISIONS.md](decisions/DECISIONS.md).
