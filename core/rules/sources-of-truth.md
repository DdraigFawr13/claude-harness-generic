# Sources of truth

- **SRC-01** Every fact has one home. Link to it; never copy it.
  <!-- why: the same CI guide was copied into 7 repos and one copy drifted. | source: AI-Master-Instructions SRC-01 -->
- **SRC-02** When sources disagree, HANDOFF.md decides. Reload a stale source from it; don't reconcile toward the stale one. The owner's current instruction beats every file.
  <!-- why: after a project restarted, files from the old premise kept being treated as current. | source: AI-Master-Instructions SRC-02 -->
- **SRC-03** Keep project facts out of reusable prompts, agents and skills. They read facts from the project's files.
  <!-- why: every agent definition went stale when a project's premise changed. | source: AI-Master-Instructions SRC-03 -->
- **SRC-04** Record decisions in docs/DECISIONS.md as Status, Decision and Why. Mark ideas Proposed until the owner approves them. A change to a settled rule updates DECISIONS in the same change.
  <!-- why: unrecorded or silently changed rules caused design drift. | source: AI-Master-Instructions SRC-04 -->
- **SRC-05** When a mistake is found, add or bump a one-line docs/LESSONS.md entry: area, mistake, root cause, rule, count. At a count of 2, also make it a rule. Mark retired entries SUPERSEDED; never delete them.
  <!-- why: repeat mistakes were caught only once they had a counter and a promotion rule. | source: AI-Master-Instructions SRC-05 -->
- **SRC-06** Never hand-edit `.harness/RULES.md`. Change a rule in `.harness/rules/` (keep its id; retire it with `SUPERSEDED by <id>: <reason>`), record why in DECISIONS, then regenerate with `node .harness/harness.mjs rules`.
  <!-- why: a formatter rewrote a hand-edited generated copy and it drifted from its source. | source: AI-Master-Instructions SRC-06, adapted for projects that own their rules (D-001) -->
