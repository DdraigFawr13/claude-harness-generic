# Setup playbook (for the AI doing the setup)

You are setting up an AI working harness in a project from this kit. Follow these steps in order. The setup takes three rounds of commands, which the owner runs and pastes back to you. You edit the files. Read this whole file first; it is about 130 lines.

What the project ends up with:

- `AGENTS.md`: project instructions (under 80 lines). `CLAUDE.md` imports it and the rules.
- `.harness/RULES.md`: the shared rules, generated from `.harness/rules/`. The project owns and edits these rules.
- `.harness/harness.json`: project name, shell, who runs commands, and check commands.
- `.harness/harness.mjs`: `doctor` (is setup complete?), `rules` (regenerate), `run` (all checks, compact output).
- `docs/HANDOFF.md`, `docs/DECISIONS.md`, `docs/LESSONS.md`: state, settled rules, mistakes.

## Step 0: assumptions to keep in mind

- If you cannot run commands, the owner runs them. Follow `core/rules/commands.md` from the start: one copy-paste block per round, written for the owner's shell, read-only commands first, and anything that changes state in its own labelled block.
- You can read and edit files. If you can't, give the owner each file's full content to paste, one file per block.
- Node 18 or later is needed for the scripts. Without it, use "No Node" at the end.

## Step 1: ask the owner (one message)

Setup intake is the one place to ask several questions at once: each has a default, so "defaults" is a valid answer. Ask exactly these:

1. **Project folder:** the full path of the repo to set up. Default: the folder this session is in.
2. **Shell:** PowerShell, cmd or bash. Default: PowerShell on Windows, bash elsewhere.
3. **Who runs commands:** owner (you paste commands to them) or agent (you run them). Default: owner.
4. **Check commands:** the commands that test, lint or build the project, such as `npm test` or `dotnet test`. Default: none yet. This is a placeholder for you to fill, and `doctor` fails until there is a real one.
5. **Where the kit is:** the path to this kit's folder on that machine. Default: next to the project.

## Step 2: round 1, check the tools (read-only)

Send the block below, with the paths filled in. Each line runs in PowerShell, cmd and bash alike.

```
node --version
git --version
git -C "<project folder>" status --short --branch
node "<kit folder>/scripts/harness.mjs" check
```

Expected: Node `v18` or later, a git version, the project's branch, and `check: ... 0 problem(s)`. If Node is missing or older, go to "No Node". If `check` reports problems, the kit copy is damaged. Ask the owner to copy the kit again.

## Step 3: round 2, set up the files (changes state)

Label this block "writes files into the project; deletes and overwrites nothing". Add one `--check` per check command from step 1, and omit `--check` if there are none.

```
node "<kit folder>/scripts/harness.mjs" init --target "<project folder>" --shell <powershell|cmd|bash> --runner <owner|agent> --check "<check command>"
cd "<project folder>"
node .harness/harness.mjs doctor
```

`init` never overwrites. If the project already has `AGENTS.md`, `CLAUDE.md` or `.gitignore`, init keeps them and says "kept existing". Merge those by hand in step 4: keep the project's content, add the kit's sections, and make sure `CLAUDE.md` contains the two lines `@AGENTS.md` and `@.harness/RULES.md`.

Expected: `doctor:` lines listing the `{{FILL: ...}}` placeholders as `fill <path>:<line>`, plus `"checks" is empty` if no check was given.

## Step 4: fill the placeholders (your edits, no commands)

For each `fill <path>:<line>` line, replace the placeholder with real content. Take facts from the project's files (README, package or build files, CI config). Ask the owner only for what isn't written down (WS-06). Keep `AGENTS.md` under 80 lines. If checks were missing, add them to `.harness/harness.json` `"checks"` as `{ "name": "...", "run": "..." }` and list them in AGENTS.md "Local checks".

## Step 5: fit the rules to this environment (your edits)

Read `.harness/RULES.md` once. For each rule that cannot apply here, retire it in `.harness/rules/<file>.md`. Replace the rule's text with `SUPERSEDED by <id or "none">: <reason>`, keep the id, and list it in D-001 "Rules changed for this project". Don't delete rules and don't renumber them. Likely candidates:

- No pull requests or CI here: GIT-07, CI-02, CI-07. CI-03 is marked never override; keep it if any CI exists.
- No sub-agents in your tool: DEL-01, DEL-04, DEL-05, DEL-08.
- No UI: VER-06.
- The agent runs its own commands: keep CMD-04 and CMD-05, retire CMD-01 to CMD-03.

Retire a rule only when it can't apply, not because it is inconvenient. Rules marked `(never override)` stay. To add a project-wide rule, put it in AGENTS.md "Project rules". Add it to `.harness/rules/` only if it has a why and a source, in the format `.harness/rules/*.md` already uses.

## Step 6: round 3, verify (read-only)

```
node .harness/harness.mjs rules
node .harness/harness.mjs doctor
node .harness/harness.mjs run
```

`rules` rewrites only the generated `.harness/RULES.md`. Done means:

- `doctor: 0 problem(s)`.
- `run:` shows every check as `PASS`.

If `run` fails, the project's own checks fail. That is not a setup problem. Report it (REP-02) and don't change tests to make it pass (VER-01). If a line is cut off, read `.harness/last-run.log` yourself.

## Step 7: smoke test the new harness

Ask the owner to start a fresh session in the project and paste the prompts from [docs/SMOKE-TEST.md](docs/SMOKE-TEST.md), one at a time. The file gives the expected behaviour for each prompt. Two or more misses mean the rules are not loading: check that the tool reads `CLAUDE.md` or `AGENTS.md`, and that `.harness/RULES.md` exists.

## Step 8: commit (changes state)

Label this block "creates a branch and a commit; pushes nothing".

```
git checkout -b ai-harness-setup
git add AGENTS.md CLAUDE.md .gitignore .gitattributes .harness docs
git commit -m "Add AI working harness: rules, handoff, decisions, lessons, check runner"
```

Pushing and opening a PR follow the project's normal process. Then update `docs/HANDOFF.md` "Just done" and "Next" (CTX-03).

## No Node

The rules and templates are plain Markdown, so the harness works without the scripts. You lose `doctor`, `rules` and `run`.

1. Copy `core/templates/AGENTS.md` and `CLAUDE.md` to the project root. Copy `HANDOFF.md`, `DECISIONS.md` and `LESSONS.md` to `docs/`. Copy `core/rules/` to `.harness/rules/`.
2. Replace `{{PROJECT}}`, `{{DATE}}`, `{{KIT}}` (the version in `kit.json`), `{{SHELL}}`, `{{RUNNER}}`, `{{RUNNER_TEXT}}` and `{{CHECKS}}`, then every `{{FILL: ...}}`. `{{RUNNER_TEXT}}` is the owner or agent text in `scripts/harness.mjs`, `RUNNER_TEXT`.
3. Write `.harness/RULES.md`. Start with `# Shared rules (<project>)`. Then, for each rule file in `kit.json` order, write `## <title>` followed by its live rule lines, without the `<!-- why -->` lines or SUPERSEDED rules.
4. Replace the `node .harness/harness.mjs run` lines in AGENTS.md with the project's own check commands.

## Later

Items in the full AI-Master-Instructions setup that this kit leaves out, and how to add them, are in [docs/PORTING.md](docs/PORTING.md).
