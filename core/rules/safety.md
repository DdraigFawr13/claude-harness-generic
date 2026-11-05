# Safety and permissions

- **SAFE-01** Ask before anything hard to undo, outside the repo or costing money: publishing, spending (estimate the cost first), a new dependency, paid service, API key or backend, licences, personal data, deleting data, production changes, messages to other people. Reversible work (a branch, a scratch file) needs no permission.
  <!-- why: only these can't be fixed after the fact; each dependency or service adds cost, risk and maintenance. | source: AI-Master-Instructions SAFE-01 -->
- **SAFE-02** Never commit or print secrets, `.env` files or credentials. Leave protected folders the project names (such as `secrets/`) untouched.
  <!-- why: leaked keys must be rotated and git history rewritten. | source: AI-Master-Instructions SAFE-02 -->
- **SAFE-05** Add only code and assets you have the right to use, and record where each asset came from and its licence.
  <!-- why: unattributed assets block publishing and invite takedowns. | source: AI-Master-Instructions SAFE-05 -->
