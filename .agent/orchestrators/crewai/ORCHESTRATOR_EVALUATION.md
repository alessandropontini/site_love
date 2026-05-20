# CrewAI Orchestrator Evaluation Matrix

This matrix defines how SITE LOVE evaluates CrewAI as a pluggable orchestrator candidate. Fase 5c evaluates real CrewAI dry-run execution while keeping Codex as the operational executor. Fase 5d adds the executor boundary documented in `.agent/contracts/crewai-codex-executor-contract.md`. The evaluation is limited to orchestration behavior, request/response contracts, and report quality. It does not change the merge gate.

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
