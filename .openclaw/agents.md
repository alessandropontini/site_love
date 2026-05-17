# OpenClaw Agent Mapping

OpenClaw should map SITE LOVE reviewer roles to the existing prompt files. These mappings are templates only; valid review evidence still comes from real provider-backed reports under `.agent/reports/<run-id>/`.

| OpenClaw role | Existing prompt |
| --- | --- |
| Frontend Architect | `.agent/prompts/review-frontend-architect.md` |
| Code Review | `.agent/prompts/review-code.md` |
| UX / Accessibility | `.agent/prompts/review-ux-a11y.md` |
| Performance | `.agent/prompts/review-performance.md` |
| QA / Regression | `.agent/prompts/review-qa-regression.md` |
| Git / Workflow Reviewer | `.agent/prompts/review-git-workflow.md` |

Minimum required reviewers for every patch:

- Code Review
- QA / Regression

Add Git / Workflow Reviewer for changes touching `.openclaw/`, `.agent/`, `scripts/`, workflow documentation, CI, package files, or `AGENTS.md`.
