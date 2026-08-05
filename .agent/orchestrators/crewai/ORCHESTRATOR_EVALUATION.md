# CrewAI Orchestrator Evaluation Matrix

> Archived evaluation record. These criteria do not define the current merge gate; the active release policy is the single combined read-only Codex review in `docs/multiagent-workflow.md`.

This matrix defines how SITE LOVE evaluates CrewAI as a pluggable orchestrator candidate. Fase 5c evaluates real CrewAI dry-run execution while keeping Codex as the operational executor. Fase 5d adds the executor boundary documented in `.agent/contracts/crewai-codex-executor-contract.md`. Fase 5e tests a real CrewAI Executor Request dry-run without executing Codex. Fase 5f tests a real no-write handshake where CrewAI generates the request and a local Codex no-write adapter reads it and produces a response. Fase 5g tests a no-write scoped patch plan where the adapter produces a plan and reviewer evaluation without a real code diff. The evaluation is limited to orchestration behavior, request/response contracts, planning artifacts, and report quality. It does not change the merge gate.

## 1. Role Separation

- Description: Implementation, review, and aggregation roles are defined as separate CrewAI agents or task lanes.
- Why it matters: The implementer cannot approve its own patch, and reviewers must remain independent.
- How to verify: Inspect `agents.yaml`, `tasks.yaml`, and the generated report for separate implementer, reviewer, and aggregator outputs.
- Passing condition: The report shows separate role outputs from CrewAI task execution and no role both implements and approves.

## 2. Deterministic Report Path

- Description: Reports are written to a predictable run directory under `.agent/reports/<timestamp>/`.
- Why it matters: Review evidence must be findable, auditable, and compatible with existing repository conventions.
- How to verify: Run the dry-run script and confirm the generated report path.
- Passing condition: A report exists at `.agent/reports/<timestamp>/crewai-orchestrator-evaluation.md`.

## 3. Structured Output

- Description: The report follows the required markdown section contract.
- Why it matters: Humans and future tooling need stable fields for evidence, limitations, and verdicts.
- How to verify: Compare the report against `dry_run_contract.md`.
- Passing condition: All mandatory fields and sections are present.

## 4. Canonical Verdict

- Description: The final verdict uses only approved values.
- Why it matters: Merge policy and review interpretation depend on consistent verdict language.
- How to verify: Inspect `Final verdict:` in the report.
- Passing condition: The verdict is one of `PASS`, `PASS WITH NOTES`, `CHANGES REQUESTED`, `BLOCKED`, or `INFRASTRUCTURE BLOCKED`.

## 5. Failure Transparency

- Description: Import failures, missing CrewAI execution, incomplete output, or incomplete evidence are declared plainly.
- Why it matters: A blocked evaluation is safer than a false approval.
- How to verify: Inspect `Evidence`, `Limitations`, and `Final decision`.
- Passing condition: Missing real execution produces `INFRASTRUCTURE BLOCKED`; real execution with incomplete output produces `CHANGES REQUESTED`; complete real dry-run execution may produce `PASS WITH NOTES`.

## 6. No Repo Modification

- Description: The dry-run does not modify application files, repository workflow files, package files, or merge scripts.
- Why it matters: Orchestration evaluation must be safe and reversible.
- How to verify: Run `git status --short` before and after the dry-run.
- Passing condition: The dry-run only creates report output under `.agent/reports/<timestamp>/`, and stable adapter changes stay under `.agent/orchestrators/crewai/`.

## 7. No Merge Gate Integration

- Description: CrewAI is not wired into merge approval or `scripts/local-review.sh`.
- Why it matters: The current real review workflow must remain stable until a reviewed decision changes it.
- How to verify: Confirm no changes to merge scripts, package files, or CI gate files.
- Passing condition: CrewAI remains a standalone adapter candidate and no auto-merge behavior is introduced.

## 8. Pluggability

- Description: CrewAI-specific files live under `.agent/orchestrators/crewai/`.
- Why it matters: The orchestrator must be replaceable without rewriting executor, policy, or report layers.
- How to verify: Inspect file paths and ensure no application imports or runtime dependencies point to CrewAI.
- Passing condition: CrewAI is isolated to its adapter directory and generated reports.

## 9. Compatibility With `.agent/reports`

- Description: Evaluation evidence follows the repository report directory convention.
- Why it matters: Existing report review habits and tooling can inspect the output.
- How to verify: Inspect the generated report directory and markdown report.
- Passing condition: The report is stored under `.agent/reports/<timestamp>/` with clear evidence fields.

## 10. Human Approval Preserved

- Description: The report never declares a patch mergeable without human approval.
- Why it matters: SITE LOVE requires final human approval for every merge.
- How to verify: Inspect `Final decision` and `Next step`.
- Passing condition: The report states that the spike does not authorize merge and that human approval remains mandatory.

## 11. Executor Contract Preserved

- Description: CrewAI may prepare an Executor Request for Codex, and Codex may return an Executor Response, but CrewAI does not execute repository writes directly.
- Why it matters: Orchestration, execution, policy, reports, and human approval must remain separate layers.
- How to verify: Inspect `.agent/contracts/crewai-codex-executor-contract.md` and confirm no merge-gate scripts require CrewAI.
- Passing condition: CrewAI remains optional and pluggable, Codex remains the executor for real repository operations, and no automatic bridge changes `scripts/local-review.sh`.

## 12. Executor Request Dry-Run

- Description: CrewAI generates a structured Executor Request and the script validates required fields and safety constraints.
- Why it matters: The project can test orchestration-to-executor handoff shape before allowing any real Codex patch execution.
- How to verify: Run `.agent/orchestrators/crewai/run_executor_request_dry_run.py` from the CrewAI venv and inspect `.agent/reports/<timestamp>/executor-request.md`.
- Passing condition: `Real CrewAI execution: yes`, `Executor Request valid: yes`, `Real Codex execution: no`, `Repo modification: no`, `Git operations: no`, and the final verdict is `PASS WITH NOTES`.

## 13. Codex No-Write Handshake

- Description: CrewAI generates a structured Executor Request and the Codex no-write adapter reads that actual request to produce a compliant Executor Response.
- Why it matters: The project can test the executor handoff before permitting write-capable Codex patches or merge-gate integration.
- How to verify: Run `.agent/orchestrators/crewai/run_codex_no_write_handshake.py` from the CrewAI venv and inspect `.agent/reports/<timestamp>/crewai-codex-no-write-handshake.md`, `executor-request.md`, and `executor-response.md`.
- Passing condition: `Real CrewAI execution: yes`, `Executor Request valid: yes`, `Real Codex execution: yes`, `Codex execution mode: read-only/no-write`, `Executor Response valid: yes`, `Repo modification: no`, `Git operations: no`, and the final verdict is `PASS WITH NOTES`.
- Non-goals: no repository patch, no real code review on a diff, no CrewAI repository write permission, no commit/push/merge by CrewAI or the adapter, and no merge-gate connection.

## 14. Scoped Patch Plan

- Description: CrewAI generates a structured Executor Request, the Codex no-write adapter reads it, and the adapter produces a scoped patch plan, reviewer evaluation, Executor Response, and canonical report.
- Why it matters: The project can test planning and review-shape handoff before permitting any write-capable Codex implementation.
- How to verify: Run `.agent/orchestrators/crewai/run_scoped_patch_plan.py` from the CrewAI venv and inspect `.agent/reports/<timestamp>/crewai-scoped-patch-plan.md`, `executor-request.md`, `scoped-patch-plan.md`, `reviewer-evaluation.md`, and `executor-response.md`.
- Passing condition: `Real CrewAI execution: yes`, `Executor Request valid: yes`, `Real Codex execution: yes`, `Codex execution mode: read-only/no-write`, `Scoped Patch Plan valid: yes`, `Reviewer evaluation generated: yes`, `Aggregator verdict generated: yes`, `Repo modification: no`, `Git operations: no`, and the final verdict is `PASS WITH NOTES`.
- Non-goals: no application file modification, no applied patch, no real review on a code diff, no CrewAI repository write permission, no Git operation by CrewAI or the adapter, and no merge-gate connection.
