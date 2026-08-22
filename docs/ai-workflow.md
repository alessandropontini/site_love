# AI Workflow: Codex, validation, and documentation

Codex is the only active AI development and review tool for SITE LOVE. CrewAI, OpenClaw, Ruflo, Claude Flow, MCP agent runtimes, and WASM agents are not part of the release path.

## Runtime boundary

The site must work with ordinary project commands only:

```bash
npm run dev
npm run lint
npm run build
npm run start
```

Never add AI tools, provider SDKs, or orchestration packages to runtime or development dependencies. Local Codex authentication and review reports stay outside the deployed app.

## Standard task flow

1. Inspect the relevant source, `AGENTS.md`, and the applicable product or privacy guide.
2. State the intended scope, risks, validation, and files deliberately left untouched when the task is not trivial.
3. Implement the smallest coherent change. Do not remount games, weaken RSVP privacy, alter deployment, or change approved assets without the required user approval.
4. Validate in proportion to the change:
   - documentation or copy: `git diff --check`;
   - code or configuration: `git diff --check`, `npm run lint`, and `npm run build`;
   - visible public behavior: the previous checks plus a local browser check of the affected flow;
   - assets or RSVP work: also record the required provenance, privacy, or endpoint evidence.
5. Update `CHANGELOG.md` under `Unreleased` and every directly affected guide, README section, or architecture note. Say explicitly when no additional guide is affected.
6. Run an independent review only when the task meets the criteria below.
7. Hand off a short summary, validation results, known limitations, and a proposed commit message. Do not commit, merge, or push unless the user asks.

## Risk-based independent review

Routine work does not require a separate Codex review: documentation and copy changes, contained visual polish, focused bug fixes, and small refactors that do not alter public routes, data, privacy, dependencies, configuration, or retained-game behavior.

Run the independent, read-only review with `scripts/local-review.sh` before a release or when a task changes:

- dependencies, Next.js/React/TypeScript configuration, build, deployment, environment variables, security, or authentication;
- RSVP routes, guest data, tokens, QR codes, storage, or privacy boundaries;
- public routing, major architecture, or a substantial accessibility/performance behavior;
- retained-game progression, challenge logic, persistence, rewards, reset, or finale gating;
- personal or venue imagery, including provenance or metadata concerns;
- anything the user explicitly requests to be independently reviewed.

When required, provide the original request and acceptance criteria in a file outside the repository. Include supplemental evidence for screenshots, assets, or endpoint checks that cannot be represented in a diff:

```bash
MULTIAGENT_PROVIDER=codex \
  ./scripts/local-review.sh --request-file /tmp/site-love-review-request.md
```

The report is evidence for human judgment, not an automatic commit, merge, or deployment. `PASS` and `PASS WITH NOTES` do not replace human approval. See `docs/multiagent-workflow.md` and `docs/codex-multiagent-setup.md` when this review is needed.

## Public-home regression checks

- `/` remains the only canonical guest-facing route and continues to mount `EditorialHome`.
- The public sequence remains story → photographs → Casa Nuova Niviano → RSVP → letter.
- No public CTA, component, or route mounts or links to `ExperienceShell` or another game tree.
- RSVP remains informational until a backend exists; no guest data, token, response, or functional QR is committed or shipped client-side.
- Keyboard, touch, focus restoration, mobile reading order, reduced motion, and Italian/English content remain usable when affected.

If dormant game code is deliberately changed, also follow `docs/quest-guide.md`. If imagery changes, follow `docs/editorial-home.md` and preserve the documented privacy and provenance requirements.
