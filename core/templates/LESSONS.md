# Lessons

One line per mistake (SRC-05). Read the entries for an area before working in it. When a mistake repeats, bump its count; at ×2 it also becomes a rule (in DECISIONS, AGENTS.md or `.harness/rules/`). Mark retired entries SUPERSEDED; never delete them.

Format: `- <area> · <mistake> · <root cause> · <rule> · ×<n> (<YYYY-MM-DD>)`

Example: `- ci · formatter failure reached CI · a filtered output hid the warning · keep warn/ERR/FAIL markers in filters · ×1 (2026-01-01)`
