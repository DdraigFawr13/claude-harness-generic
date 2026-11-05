# claude-harness-generic

A bare-bones AI working harness: rules, handoff, decisions and lessons files, plus one check script. It is built for an AI on any account to set itself up in a project quickly, including setups with no connectors where the owner runs the commands. It is cut down from AI-Master-Instructions, keeps its structure and rule ids, and drops the parts that need cloud sessions, hooks or integrations ([what changed](docs/PORTING.md)).

## Use it

1. Get this kit onto the machine: clone it, or download the ZIP from GitHub.
2. Open an AI session in the project you want to set up and tell it: "Read `<kit folder>/SETUP.md` and set up the harness in this project."
3. It asks five questions (each has a default), then gives you three blocks of commands to run and paste back. It edits the files itself.

Done looks like `doctor: 0 problem(s)` and every check `PASS`. Then paste the six prompts in [docs/SMOKE-TEST.md](docs/SMOKE-TEST.md) into a fresh session to confirm the rules load.

## What a project gets

- `AGENTS.md`: project instructions, including who runs commands and in which shell. `CLAUDE.md` imports it and the rules.
- `.harness/RULES.md`: 52 one-line rules, generated from `.harness/rules/`, which the project owns and can change.
- `.harness/harness.mjs`, three commands the owner can run:
  - `doctor`: is the setup complete and within budget? It lists each placeholder still to fill.
  - `rules`: regenerate RULES.md after a rule change.
  - `run`: run all the project's checks. It prints PASS or FAIL with the error lines only, which is short enough to paste back. The full log goes to `.harness/last-run.log`.
- `docs/HANDOFF.md` (capped at 60 lines), `docs/DECISIONS.md` and `docs/LESSONS.md`.

The rule topics are working style, commands the owner runs (CMD), context and handoff, verification, reporting, git, delegation, safety, sources of truth, and CI budget.

## Needs

Node 18 or later, with no packages, on Windows, macOS or Linux. Without Node, SETUP.md has a manual path.

## Change the kit

Read [AGENTS.md](AGENTS.md). Local checks: `node scripts/harness.mjs check && node --test`. Design decisions: [decisions/DECISIONS.md](decisions/DECISIONS.md).
