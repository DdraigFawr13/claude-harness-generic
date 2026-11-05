# Context and handoff

- **CTX-01** At session start read AGENTS.md and the rules it loads, then docs/HANDOFF.md, then the DECISIONS headings (search for `## D-`), not the whole file. Open other docs only for the section the task needs. Search archives; never read them whole.
  <!-- why: session-start reading fell from ~25k to ~5.5k tokens with this order. | source: AI-Master-Instructions CTX-01 -->
- **CTX-02** HANDOFF.md must let a fresh session continue with no chat history: phase, just done, next, open questions, recent decisions. Keep it to 60 lines; move finished entries to `docs/archive/` monthly.
  <!-- why: an append-only 76 KB handoff made every session start expensive (lesson x2). | source: AI-Master-Instructions CTX-02 -->
- **CTX-03** Update HANDOFF at every checkpoint: after each commit, before a large step or a delegation, and whenever the owner decides something.
  <!-- why: context can be compacted or lost at any point; unsaved state is gone. | source: AI-Master-Instructions CTX-03 -->
- **CTX-04** Write logs as dated one-line list entries, not wide tables.
  <!-- why: formatters re-pad a whole Markdown table when one row grows, bloating diffs and tokens. | source: AI-Master-Instructions CTX-04 -->
- **CTX-05** Near the context limit, start no new work: update HANDOFF, commit (or give the owner the commit commands) and say so. After a compaction, resume from HANDOFF without asking.
  <!-- why: work past the limit is lost on compaction. | source: AI-Master-Instructions CTX-05 -->
- **CTX-06** Keep always-loaded files short. Put detail in linked docs that load only when needed.
  <!-- why: always-loaded text is paid for every turn; Claude Code docs target CLAUDE.md under 200 lines. | source: AI-Master-Instructions CTX-06 -->
