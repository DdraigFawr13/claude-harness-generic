# Porting: what came from AI-Master-Instructions

This kit is a cut-down copy of the AI-Master-Instructions harness, for environments with no connectors, no app integrations, and commands the owner runs by hand (D-001). This page says what was kept, what changed and what was left out, so the full items can be added later.

## Kept, same ids

- Rules: WS-01 to WS-04, WS-06 to WS-08; CTX-01 to CTX-06; VER-01 to VER-08; REP-01 to REP-03; GIT-01 to GIT-07; DEL-01, DEL-04, DEL-05, DEL-08; SAFE-01, SAFE-02, SAFE-05; SRC-01 to SRC-06; CI-02, CI-03, CI-07. Each rule's source comment names its master id.
- Formats: one rule per line with a `why | source` comment, stable ids, SUPERSEDED instead of delete; HANDOFF capped at 60 lines and 8 KB; dated one-line LESSONS with a count; DECISIONS as Status, Decision, Why.
- Checks: a start-up budget of 200 lines and 24 KB, the HANDOFF cap, rule-format checks, and a generated-file drift check.

## Changed

- **Wording:** references to phones, cloud sessions, `send_later`, artifact pages and named people are gone. CI-07 becomes "check CI yourself or ask the owner"; CTX-05 allows giving the owner the commit commands.
- **SRC-06:** a project owns `.harness/rules/` and regenerates `.harness/RULES.md`, instead of syncing from a pinned master version (D-001).
- **Layout:** `.harness/` replaces `.claude/master/`, so the setup is not tied to one tool. `CLAUDE.md` still imports the rules, and `AGENTS.md` points other tools to them.
- **New:** CMD-01 to CMD-05, for commands the owner runs, and `harness.mjs run`, one compact check command (D-003).

## Left out, and how to add each later

- **Sync and version pinning** (`sync/sync.mjs`, `.ai-master.json`, the lock): worth it once 3 or more projects share rules. Turn this kit into a master repo with the full repo's sync script.
- **Guard hooks** (asking before a force push, a test deletion or a secret read): Claude Code only, and they need hook permission. Less needed when the owner runs every command.
- **Agents** (implementer, reader, test-runner, ci-fixer, reviewer) and the `routing` skill: they need sub-agents and model choice. Without them, retire the DEL rules (SETUP step 5).
- **Skills** (write-spec, planning-interview, brainstorm, audit, ui-style, ui-mockups, efficient-github-actions): each is a standalone `SKILL.md` folder. Copy one when its job comes up, and remove project facts from it (SRC-03).
- **Stack and project-type layers** (node-web, expo-mobile, supabase, web-app, game, simulator, creative-writing): add their rule files to `.harness/rules/` with a new id prefix each.
- **Rules left out:** CI-05 (deploys) and CI-06 (workflow shape) are GitHub Actions specific; VER-09 and DEL-03 point to skills not included; DEL-06 and DEL-07 cover parallel agents and tool adoption.
- **Eval harness and drift reader:** measuring rule effect needs scripted sessions and API spend. Use docs/SMOKE-TEST.md instead.
