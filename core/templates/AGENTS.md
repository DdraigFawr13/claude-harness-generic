# Agent instructions: {{PROJECT}}

{{FILL: one or two sentences: what this project is and who it is for.}}

Shared rules are in `.harness/RULES.md`. CLAUDE.md loads it; other tools, read it at session start. This file holds only what is specific to this project. Keep it under 80 lines.

## Read first

1. `docs/HANDOFF.md`: current state and next step.
2. `docs/DECISIONS.md` headings (search `## D-`): settled rules. Don't reopen them.
3. `docs/LESSONS.md`: entries for the area you are about to work in.

## How commands run here

{{RUNNER_TEXT}}

- Shell: {{SHELL}}. Write every command for it.
- Commands the agent may run without asking: {{FILL: list them, or "none: the owner runs every command"}}.

## Local checks (run before every push)

- One command, compact output: `node .harness/harness.mjs run`. It runs {{CHECKS}} and writes the full log to `.harness/last-run.log`.
- Setup and budget check: `node .harness/harness.mjs doctor`.

## Project rules

- {{FILL: rules that bind every agent here, one line each with its why, or "None yet."}}

## Changing the shared rules

Edit `.harness/rules/` (SRC-06): keep ids stable, retire a rule with `SUPERSEDED by <id>: <reason>`, record the change in `docs/DECISIONS.md`, then run `node .harness/harness.mjs rules`.
