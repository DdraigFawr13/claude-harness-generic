# Git and branches

- **GIT-01** One branch per unit of work, cut from the latest default branch. Never reuse a merged branch.
  <!-- why: stacking on merged history makes unreviewable PRs. | source: AI-Master-Instructions GIT-01 -->
- **GIT-02** After a merge, write follow-up notes on the next branch, never the merged one.
  <!-- why: a late push recreated the auto-deleted branch one commit ahead of main. | source: AI-Master-Instructions GIT-02 -->
- **GIT-03** Never delete an unmerged branch, rewrite shared history or force-push another person's branch without explicit approval. (never override)
  <!-- why: unrecoverable loss of someone's work. | source: AI-Master-Instructions GIT-03 -->
- **GIT-04** Merge parallel branches one at a time and re-run the checks after each.
  <!-- why: two individually green branches broke each other. | source: AI-Master-Instructions GIT-04 -->
- **GIT-05** Commit only green states, with a message saying what changed and why.
  <!-- why: each push to a PR branch starts a CI run; GIT-05 was the one rule the no-rules eval arm broke. | source: AI-Master-Instructions GIT-05 -->
- **GIT-06** After a crash or restart, check `git status`, `git worktree list` and each worktree's unmerged commits before starting new work.
  <!-- why: parallel work leaves unmerged commits that a fresh session cannot see otherwise. | source: AI-Master-Instructions GIT-06 -->
- **GIT-07** After the owner approves the work, merge when checks are green without waiting for a reminder. Before approval a draft PR is fine; never mark it ready or merge it.
  <!-- why: "merge it" was repeated in 5 sessions of a drift baseline. | source: AI-Master-Instructions GIT-07 -->
