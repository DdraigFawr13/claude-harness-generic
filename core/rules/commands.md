# Commands the owner runs

- **CMD-01** Read AGENTS.md "How commands run here" before running anything. When the owner runs commands, send them in one copy-paste block per round, written for the owner's shell, with one line on what the block does and what to paste back.
  <!-- why: in setups where agent permissions block commands, every round trip costs the owner's time, and commands for the wrong shell fail. | source: new for owner-run setups (D-003) -->
- **CMD-02** Plan what you need to know first, then ask for every read-only command in one round. Prefer the project's single check command (`node .harness/harness.mjs run`) over separate ones.
  <!-- why: one command at a time multiplies round trips; one wrapper with compact output replaces several pastes. | source: new for owner-run setups (D-003); AI-Master-Instructions DEL-07 "chores belong in scripts" -->
- **CMD-03** Put commands that change anything (write, delete, install, push) in their own block, labelled as changing state, after the read-only block. Never mix the two.
  <!-- why: an owner pasting a mixed block can't see which line deletes or pushes; SAFE-01 actions need a visible ask. | source: new for owner-run setups (D-003); AI-Master-Instructions SAFE-01 -->
- **CMD-04** Ask for compact output: the summary line and failures, not full logs. When a full log is needed, have it written to a file you can read.
  <!-- why: pasted full logs fill the context and get cut off mid-error. | source: new for owner-run setups (D-003); AI-Master-Instructions VER-03 -->
- **CMD-05** A command's result is only what the owner pasted back. Never report a result you haven't seen, and treat missing or empty output as unknown, not passed.
  <!-- why: silent omissions read as passes, and results assumed from a command sent but not seen are guesses. | source: new for owner-run setups (D-003); AI-Master-Instructions REP-01, REP-02, VER-03 -->
