# Candidates

Ideas that don't meet the bar yet (AGENTS.md), each with its source.

- **PowerShell port of `harness.mjs`** for machines without Node. Source: open question in HANDOFF (2026-11-05). Add it if the first work setup has no Node.
- **A `lite` profile** (NOTES.md instead of HANDOFF, DECISIONS and LESSONS; about 15 rules) for scripts and one-off tools. Source: AI-Master-Instructions D-056. Add it once a small project needs it.
- **A read-only command allowlist** (`.claude/settings.json` permissions for git status, diff, log and the harness commands), so the agent can run safe commands itself. Source: AI-Master-Instructions core/templates/settings.json. Add it only if the work account's policy allows project permissions.
- **Kit updates for projects** (`init --update` copying new rule files and reporting changed ones without overwriting). Source: AI-Master-Instructions sync drift check (D-059). Add it when a second kit release has to reach existing projects.
