# CI budget

- **CI-02** CI minutes and runners are shared and often billed. Push at reviewable checkpoints, not after every edit, and don't trigger full or manual runs for trivial changes. Cancelled runs still bill.
  <!-- why: 167 of 184 runs in one week were PR updates; manual full runs are the most expensive runs. | source: AI-Master-Instructions CI-02 -->
- **CI-03** If a run can't start or fails with a billing, quota, spending-limit or runner-provisioning message: stop and report the exact message. Don't re-run, push empty commits, or close and reopen the PR. (never override)
  <!-- why: only the account owner can fix billing; retries burn time and minutes. | source: AI-Master-Instructions CI-03 -->
- **CI-07** After pushing, check the CI result yourself or ask the owner for it in your next message. Never assume green, and never say a notice will come.
  <!-- why: a green run sent no notice twice and the owner had to ask; all 4 corrections in a drift sample were status chases. | source: AI-Master-Instructions CI-07 -->
