# Decisions

Settled rules for this kit. Mark ideas Proposed until the owner approves them; mark retired entries SUPERSEDED, never delete them.

## D-001 A standalone kit: projects own their rules, with no sync

- **Status:** Accepted (2026-11-05)
- **Decision:** The kit is copied once into each project. The project owns `.harness/rules/` and regenerates `.harness/RULES.md` from it. There is no version pin, lock or sync from a master.
- **Why:** the target is a work environment with no connectors, where the owner runs commands. The master's sync, lock and hooks need repo access across projects and hook permissions. A copy plus a `doctor` check keeps the structure (rule format, ids, generated rules, budgets) at a fraction of the moving parts. Sync is listed in docs/PORTING.md for when 3 or more projects share rules.

## D-002 Port the master's live rules with the same ids, minus tool-specific ones

- **Status:** Accepted (2026-11-05)
- **Decision:** Keep 47 of the master's live rules, with the same ids and reworded only to remove phones, cloud sessions, artifacts and named people. Leave out CI-05, CI-06, VER-09, DEL-03, DEL-06 and DEL-07, and record why in docs/PORTING.md. Each source comment names the master id.
- **Why:** the same ids let a project move to the full harness later and let lessons be compared across both. The rules left out depend on GitHub Actions, sub-agent fan-out or skills that aren't shipped.

## D-003 Owner-run commands get their own rules and one compact check command

- **Status:** Accepted (2026-11-05)
- **Decision:** Add CMD-01 to CMD-05: one copy-paste block per round in the owner's shell, read-only commands batched first, state-changing commands in a separate labelled block, compact output, and no claimed result without pasted output. `harness.mjs run` runs every configured check. It prints PASS or FAIL with only the error lines and writes the full log to `.harness/last-run.log`.
- **Why:** the owner's work setup lets the agent edit files but not run commands, so each round trip costs the owner's time and pasted logs cost context. These are new rules without a recorded incident yet. They adapt REP-01, REP-02, VER-03 and SAFE-01, and their sources say so. Review them after the first setup (HANDOFF step 3).

## D-004 One Node script with no dependencies, Windows-safe

- **Status:** Accepted (2026-11-05)
- **Decision:** All tooling is `scripts/harness.mjs`, for Node 18+, with no packages. It is copied into each project, accepts CRLF line endings, and runs checks through the system shell. Placeholders the agent must fill are `{{FILL: ...}}`, and `doctor` lists each one by `path:line`. init never overwrites a file.
- **Why:** Claude Code installs usually come with Node, and work machines often block package installs. One file is easy to copy by hand. Windows checkouts may convert to CRLF. Listing the placeholders turns "finish the setup" into a checklist, and a no-overwrite init is safe to re-run on a repo that already has AI files. SETUP.md has a no-Node path.
