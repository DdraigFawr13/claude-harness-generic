# Lessons

One line per mistake (SRC-05). Format: `- <area> · <mistake> · <root cause> · <rule> · ×<n> (<YYYY-MM-DD>)`

- tests · a `run` test asserted a word was absent from the output, but the FAIL header echoes the command that contained it · the assertion matched the whole output, not the summarised lines · assert on the exact line shape (`^  noise$`) · ×1 (2026-11-05)
