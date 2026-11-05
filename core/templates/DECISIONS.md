# Decisions

Settled rules for this project. Not a changelog: an entry stays while the rule is in force. Change a rule here in the same change that changes the behaviour (SRC-04). Mark ideas Proposed until the owner approves them; mark retired entries SUPERSEDED with a pointer, never delete them.

## D-001 Adopt the harness kit {{KIT}}

- **Status:** Accepted ({{DATE}})
- **Decision:** Agents here follow `.harness/RULES.md`, generated from `.harness/rules/`, which this project owns. Commands are run by the {{RUNNER}} in {{SHELL}}. Rules changed or retired for this project are listed below with their reasons.
- **Why:** a shared, checked rule set (`node .harness/harness.mjs doctor`) instead of instructions rebuilt each session.
- **Rules changed for this project:** {{FILL: rule ids retired or reworded and why, or "none".}}
