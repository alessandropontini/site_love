# Executor Request

- Request ID: example-replay-button-a11y-001
- Requested by agent: CrewAI UX Accessibility Reviewer
- Intended executor: Codex
- Phase: Example only
- Task: Evaluate a future accessible change to the final Replay button.
- Scope: Documentation-only example of a future request. Do not modify repository files.
- Files allowed: `components/story/StoryShell.tsx` and related final-scene files may be inspected in a real future task after explicit approval.
- Files forbidden: `app/`, `components/`, `lib/`, `public/`, `package.json`, `package-lock.json`, `.env`, `.env.*` for this example.
- Commands allowed: `git status --short`, `git diff --stat`, `rg "Replay|Rigioca|restart" components lib app`
- Commands forbidden: `git commit`, `git push`, `git merge`, `git branch -D`, `git reset`, `git checkout --`, dependency installation, deployment commands.
- Repo writes allowed: no
- Git operations allowed: no
- Expected output: A plan-only accessibility assessment and a list of files that would need explicit approval before editing.
- Required evidence: Files inspected, commands run, risks, and stop conditions.
- Safety constraints: Do not edit code. Do not claim real review. Do not start merge-gate integration.
- Human approval required before: Any repository write, any protected path edit, any commit, push, merge, or production promotion.

## Context

CrewAI is evaluating how it would ask Codex to inspect a future accessibility improvement for the final Replay button. The expected future concern is whether the button has clear accessible naming, keyboard reachability, visible focus, and understandable replay behavior.

## Requested action

Codex should inspect only the allowed context and return a plan. Codex must not modify files in this example.

## Acceptance criteria

- Response is clearly marked as plan-only.
- No files are changed.
- Git operations are not performed.
- Any future edit lists exact files and required approvals.
- Output distinguishes accessibility recommendations from real review evidence.

## Stop conditions

- Working tree is dirty at task start.
- The request requires editing protected files without explicit human approval.
- The requested command would commit, push, merge, force push, delete branches, install dependencies, or deploy.
- The task asks Codex to self-approve or mark simulated review as real.
