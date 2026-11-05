# Delegation

- **DEL-01** The main session plans, decides, reviews, commits and merges. Keep in it: design decisions, questions for the owner, settled-rule changes, architecture, safety and final review of delegated work.
  <!-- why: these need the strongest model and the full conversation. | source: AI-Master-Instructions DEL-01 -->
- **DEL-04** A brief to a sub-agent is self-contained: goal, exact files, rules, acceptance criteria, commands to run, "do not commit", and a report-length cap. Ask for results inline, not in files.
  <!-- why: vague briefs cause guessing; a sub-agent's file write was refused and its result nearly lost. | source: AI-Master-Instructions DEL-04 -->
- **DEL-05** Review every delegated diff before committing and verify every finding before acting on it. Don't redo the work.
  <!-- why: 1 of 12 review findings was wrong and would have broken a tested rule. | source: AI-Master-Instructions DEL-05 -->
- **DEL-08** Work in the main session by default. Delegate independent work only when it needs restricted tools, is larger than one context, or is a long read or run whose output you won't keep.
  <!-- why: on a measured pilot, delegating cost more and took 18-37 s longer on 4 of 6 tasks. | source: AI-Master-Instructions DEL-08 -->
