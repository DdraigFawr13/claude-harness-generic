# Verification

- **VER-01** Never skip, disable, weaken or delete a test or check to get green. (never override)
  <!-- why: a green run that tests less is a false signal. | source: AI-Master-Instructions VER-01 -->
- **VER-02** Run the project's local checks before every push (in owner-run setups, ask for the run and read the result). Reproduce a CI failure locally before fixing it.
  <!-- why: CI is not the debugger; formatter failures reached CI twice. | source: AI-Master-Instructions VER-02 -->
- **VER-03** When filtering command output, keep warning and error markers (`warn`, `ERR`, `FAIL`, `ELIFECYCLE`). An empty filtered result is a failure until proven otherwise.
  <!-- why: a filter hid a formatter failure and the run was reported as passing. | source: AI-Master-Instructions VER-03 -->
- **VER-04** A test that passes only on retry is not green. Find the root cause; never widen an assertion or timeout to hide it.
  <!-- why: a flaky reset assertion was reported green after a retry. | source: AI-Master-Instructions VER-04 -->
- **VER-05** Before accepting a review finding, run the related tests and check it against DECISIONS. Reject findings that contradict a tested or settled rule.
  <!-- why: a reviewer finding would have broken a deliberate, tested contract. | source: AI-Master-Instructions VER-05 -->
- **VER-06** For UI work, look at the result (screenshot or render) before calling it done, and measure performance on a production build.
  <!-- why: unmeasured SVG text overflowed its boxes (x2); a page that hung under the dev server ran at 60 fps in production. | source: AI-Master-Instructions VER-06 -->
- **VER-07** Done means checks pass, the behaviour is tested end to end where the project can, and docs are updated. Manual or device checks count only with the owner's evidence.
  <!-- why: an agent cannot see a phone screen or the owner's machine; unverified is never passed. | source: AI-Master-Instructions VER-07 -->
- **VER-08** After any fix pass, re-check the lines the fix added. Fixes introduce defects.
  <!-- why: lines added to satisfy one reviewer were never read by the others. | source: AI-Master-Instructions VER-08 -->
