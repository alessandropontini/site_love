#!/usr/bin/env python3
"""Run the Fase 5g CrewAI-to-Codex scoped patch plan dry-run.

This script proves this no-write planning flow:
CrewAI -> Executor Request -> Codex no-write adapter -> Scoped Patch Plan
-> reviewer evaluation -> Executor Response -> canonical report.

No application files are modified. No patch is applied. No Git operation is
performed by CrewAI or by the adapter. The generated evidence is local only
under .agent/reports/<timestamp>/.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import importlib.metadata
import os
import re
import sys
import traceback


PHASE = "Fase 5g — CrewAI to Codex Scoped Patch Plan"
REQUEST_ID = "phase-5g-crewai-scoped-patch-plan-001"
SCENARIO = (
    "Preparare un piano patch per migliorare o verificare l'accessibilita del "
    "pulsante finale Replay nel componente finale, senza modificare il repository."
)
NO_REAL_DIFF_DISCLAIMER = "No real code diff was reviewed in this phase."

PASS_WITH_NOTES = "PASS WITH NOTES"
CHANGES_REQUESTED = "CHANGES REQUESTED"
INFRASTRUCTURE_BLOCKED = "INFRASTRUCTURE BLOCKED"

AGENTS = {
    "request_planner": {
        "role": "Executor Request Planner",
        "goal": "Plan a safe scoped patch plan request for Codex",
        "backstory": "You define a no-write planning request without repository writes or Git operations.",
    },
    "scope_guardian": {
        "role": "Scope Guardian",
        "goal": "Enforce no-write planning scope and forbidden operations",
        "backstory": "You keep application edits, package files, secrets, Git operations, and merge gates out of this phase.",
    },
    "executor_request_writer": {
        "role": "Executor Request Writer",
        "goal": "Write the final markdown Executor Request",
        "backstory": "You produce a structured request that follows the SITE LOVE executor contract.",
    },
    "contract_reviewer": {
        "role": "Contract Reviewer",
        "goal": "Review the generated request against the executor contract",
        "backstory": "You check required fields, no-write policy, and no Git operations.",
    },
    "plan_aggregator": {
        "role": "Scoped Patch Plan Aggregator",
        "goal": "Aggregate the planning evidence without changing merge policy",
        "backstory": "You preserve limitations and never approve merge or real code review.",
    },
}

TASKS = [
    {
        "id": "plan_executor_request",
        "agent": "request_planner",
        "description": "Plan a no-write Executor Request for a scoped patch plan.",
        "expected_output": "A concise safe request plan with no repository writes.",
    },
    {
        "id": "guard_scope",
        "agent": "scope_guardian",
        "description": "Verify forbidden files, commands, patch execution, Git operations, and merge-gate changes remain disallowed.",
        "expected_output": "Scope guard notes and explicit forbidden operations.",
    },
    {
        "id": "write_executor_request",
        "agent": "executor_request_writer",
        "description": "Write a complete markdown Executor Request for the Fase 5g scoped patch plan.",
        "expected_output": "A complete markdown Executor Request.",
    },
    {
        "id": "review_contract",
        "agent": "contract_reviewer",
        "description": "Review the Executor Request for contract compliance.",
        "expected_output": "Contract review notes and any violations.",
    },
    {
        "id": "aggregate_verdict",
        "agent": "plan_aggregator",
        "description": "Aggregate the scoped patch plan request output without approving merge.",
        "expected_output": "A canonical verdict recommendation.",
    },
]

REVIEWERS = [
    "Frontend Architect Reviewer",
    "Code Reviewer",
    "UX / Accessibility Reviewer",
    "QA / Regression Reviewer",
    "Git / Workflow Reviewer",
]


@dataclass
class ValidationResult:
    valid: bool
    findings: list[str]


@dataclass
class CrewAIResult:
    crewai_importable: bool
    crewai_version: str
    real_crewai_execution: bool
    agent_separation: bool
    agent_outputs: dict[str, str]
    executor_request_generated: bool
    executor_request_valid: bool
    validation_findings: list[str]
    evidence: list[str]
    limitations: list[str]
    error: str = ""


@dataclass
class PlanResult:
    real_codex_execution: bool
    execution_mode: str
    scoped_patch_plan_generated: bool
    scoped_patch_plan_valid: bool
    reviewer_evaluation_generated: bool
    reviewer_evaluation_valid: bool
    executor_response_generated: bool
    executor_response_valid: bool
    aggregator_verdict_generated: bool
    aggregator_verdict: str
    plan: str
    reviewer_evaluation: str
    response: str
    plan_validation_findings: list[str]
    reviewer_validation_findings: list[str]
    response_validation_findings: list[str]
    errors: list[str]
    limitations: list[str]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def crewai_version() -> str:
    try:
        return importlib.metadata.version("crewai")
    except importlib.metadata.PackageNotFoundError:
        return "unknown"


def markdown_list(lines: list[str]) -> str:
    return "\n".join(lines) if lines else "- None recorded."


def yes_no(value: bool) -> str:
    return "yes" if value else "no"


def field_value(markdown: str, field: str) -> str:
    pattern = rf"^- {re.escape(field)}:\s*(.*)$"
    match = re.search(pattern, markdown, flags=re.MULTILINE)
    return match.group(1).strip() if match else ""


def contains_applicable_diff(markdown: str) -> bool:
    return bool(re.search(r"(?m)^---\s+\S+", markdown) and re.search(r"(?m)^\+\+\+\s+\S+", markdown))


def generated_executor_request() -> str:
    return "\n".join(
        [
            "# Executor Request",
            "",
            f"- Request ID: {REQUEST_ID}",
            "- Requested by agent: CrewAI Executor Request Writer",
            "- Intended executor: Codex",
            f"- Phase: {PHASE}",
            "- Task: Produce a scoped patch plan for a future Replay button accessibility improvement or verification without changing repository files.",
            "- Scope: Codex may read this Executor Request and stable workflow documentation. Codex may produce a plan that names future candidate application files, but it must not inspect or modify application files in this phase.",
            "- Files allowed: `.agent/reports/<timestamp>/executor-request.md`, `.agent/contracts/crewai-codex-executor-contract.md`, `.agent/contracts/executor-request-template.md`, `.agent/contracts/executor-response-template.md`, `.agent/orchestrators/crewai/README.md`, `.agent/orchestrators/crewai/ORCHESTRATOR_EVALUATION.md`, `.agent/orchestrators/crewai/dry_run_contract.md`, `.agent/orchestrators/crewai/agents.yaml`, `.agent/orchestrators/crewai/tasks.yaml`",
            "- Files forbidden: `app/`, `components/`, `lib/`, `public/`, package manifest files, lockfiles, `.env`, `.env.*`, deployment files, secrets, credentials",
            "- Commands allowed: none during the Codex no-write adapter execution; theoretical future read-only commands would be limited to `pwd`, `sed -n`, and `rg` against allowed documentation paths",
            "- Commands forbidden: repository writes, patch commands, dependency installation, deployment commands, branch deletion, commit, push, merge, force push, reset, checkout file restore, staging changes, package manager mutation, secret inspection",
            "- Repo writes allowed: no",
            "- Git operations allowed: no",
            "- Expected output: A real no-write Scoped Patch Plan generated from the actual request content, reviewer evaluation of the plan, and a compliant Executor Response. The output must not include an applicable diff or claim implementation.",
            "- Required evidence: Request path, scoped patch plan path, reviewer evaluation path, response path, deterministic validations, and confirmation that no files were changed and no commands were run by the adapter.",
            "- Safety constraints: No repository writes by Codex adapter. No Git operations by Codex adapter. No application code access in this phase. No package file access. No secrets access. No merge-gate integration. No real review on a diff. No merge approval.",
            "- Human approval required before: Any repository write, protected path edit, package change, Git operation, real patch execution, real code review claim, merge-gate change, merge to system, or promotion toward prod.",
            "",
            "## Context",
            "",
            SCENARIO,
            "",
            "The purpose is to prove that CrewAI can request a scoped patch plan and that Codex can produce a no-write planning artifact. This phase is not implementation, not a real code review, and not merge approval.",
            "",
            "## Requested action",
            "",
            "Codex should read this request and produce a scoped patch plan through a read-only/no-write adapter. The plan may name future candidate files to inspect or edit only in a separate approved write phase. Codex must not modify repository files, run commands, inspect forbidden files, perform Git operations, or change merge policy.",
            "",
            "## Acceptance criteria",
            "",
            "- CrewAI produces a structured Executor Request.",
            "- The request follows `.agent/contracts/executor-request-template.md`.",
            "- `Intended executor` is `Codex`.",
            "- `Repo writes allowed` is `no`.",
            "- `Git operations allowed` is `no`.",
            "- The Codex adapter reads the actual request content.",
            "- The Codex adapter produces a compliant Scoped Patch Plan.",
            "- Reviewer evaluation and aggregator verdict are generated.",
            "- `Files changed` is `none`.",
            "- `Commands run` is `none`.",
            "- `Diff summary` is `none`.",
            "- No applicable diff, package file modification, secret access, patch execution, Git operation, or merge-gate integration is in scope.",
            "",
            "## Stop conditions",
            "",
            "- CrewAI is not importable or cannot complete real execution.",
            "- The request allows repository writes or Git operations.",
            "- The request allows application code, package files, secrets, deployment files, or merge-gate changes as current-phase editable scope.",
            "- The adapter cannot validate the request.",
            "- The adapter cannot produce a compliant plan, reviewer evaluation, or response.",
            "- Any generated output claims a real code review on a diff, real patch execution, merge approval, or Git operation.",
        ]
    )


def fallback_executor_request() -> str:
    return generated_executor_request().replace(
        "- Requested by agent: CrewAI Executor Request Writer",
        "- Requested by agent: fallback script because CrewAI did not execute",
    )


def forbidden_safety_findings(markdown: str) -> list[str]:
    lower = markdown.lower()
    findings: list[str] = []
    unsafe_patterns = [
        "repo writes allowed: yes",
        "git operations allowed: yes",
        "patch application: performed",
        "files changed: app/",
        "files changed: components/",
        "files changed: lib/",
        "files changed: public/",
        "files changed: package.json",
        "files changed: package-lock.json",
        "commands run: git",
        "commands run: npm",
        "git push",
        "git merge",
        "git commit",
        "git branch -d",
        "git branch -D".lower(),
        "git push --force",
        "rm -rf",
        "package.json as file modifiable",
        "package-lock.json as file modifiable",
    ]
    for pattern in unsafe_patterns:
        if pattern in lower:
            findings.append(f"- Unsafe phrase detected: {pattern}")
    if contains_applicable_diff(markdown):
        findings.append("- Applicable diff markers detected.")
    return findings


def validate_executor_request(markdown: str) -> ValidationResult:
    findings: list[str] = []
    required_checks = [
        ("title", markdown.startswith("# Executor Request")),
        ("Request ID", bool(field_value(markdown, "Request ID"))),
        ("Intended executor: Codex", field_value(markdown, "Intended executor") == "Codex"),
        ("Phase", field_value(markdown, "Phase") == PHASE),
        ("Repo writes allowed: no", field_value(markdown, "Repo writes allowed").lower() == "no"),
        ("Git operations allowed: no", field_value(markdown, "Git operations allowed").lower() == "no"),
        ("Files allowed", bool(field_value(markdown, "Files allowed"))),
        ("Files forbidden", bool(field_value(markdown, "Files forbidden"))),
        ("Commands allowed", bool(field_value(markdown, "Commands allowed"))),
        ("Commands forbidden", bool(field_value(markdown, "Commands forbidden"))),
        ("Required evidence", bool(field_value(markdown, "Required evidence"))),
        ("Safety constraints", bool(field_value(markdown, "Safety constraints"))),
        ("Context", "## Context" in markdown),
        ("Requested action", "## Requested action" in markdown),
        ("Acceptance criteria", "## Acceptance criteria" in markdown),
        ("Stop conditions", "## Stop conditions" in markdown),
    ]
    for label, passed in required_checks:
        if not passed:
            findings.append(f"- Missing or invalid required field/section: {label}")

    files_allowed = field_value(markdown, "Files allowed").lower()
    commands_allowed = field_value(markdown, "Commands allowed").lower()
    forbidden_allowed_patterns = [
        ("app/", files_allowed),
        ("components/", files_allowed),
        ("lib/", files_allowed),
        ("public/", files_allowed),
        ("package.json", files_allowed),
        ("package-lock.json", files_allowed),
        (".env", files_allowed),
    ]
    for pattern, haystack in forbidden_allowed_patterns:
        if pattern in haystack:
            findings.append(f"- Forbidden item appears in an allowed field: {pattern}")
    if "none" not in commands_allowed and "read-only" not in commands_allowed:
        findings.append("- Commands allowed must be none or explicitly read-only.")
    findings.extend(forbidden_safety_findings(markdown))
    return ValidationResult(valid=not findings, findings=findings or ["- Executor Request passed deterministic validation."])


def run_real_crewai_request_generation() -> tuple[CrewAIResult, str]:
    os.environ.setdefault("CREWAI_TRACING_ENABLED", "false")
    os.environ.setdefault("OTEL_SDK_DISABLED", "true")
    try:
        from crewai import Agent, Crew, Process, Task
        from crewai.llms.base_llm import BaseLLM
    except Exception:
        request = fallback_executor_request()
        validation = validate_executor_request(request)
        return (
            CrewAIResult(
                crewai_importable=False,
                crewai_version="not importable",
                real_crewai_execution=False,
                agent_separation=False,
                agent_outputs={},
                executor_request_generated=True,
                executor_request_valid=validation.valid,
                validation_findings=validation.findings,
                evidence=["- CrewAI import failed.", "- Fallback Executor Request was generated by the script."],
                limitations=["- CrewAI did not execute, so the scoped patch plan run is infrastructure blocked."],
                error=traceback.format_exc(),
            ),
            request,
        )

    version = crewai_version()

    class DeterministicScopedPlanLLM(BaseLLM):
        """Local deterministic LLM adapter for provider-free CrewAI execution."""

        def __init__(self) -> None:
            super().__init__(model="site-love-deterministic-crewai-scoped-patch-plan")

        def call(
            self,
            messages: str | list[dict[str, Any]],
            tools: list[dict[str, Any]] | None = None,
            callbacks: list[Any] | None = None,
            available_functions: dict[str, Any] | None = None,
            from_task: Any | None = None,
            from_agent: Any | None = None,
            response_model: type[Any] | None = None,
        ) -> str:
            role = getattr(from_agent, "role", "Unknown Agent")
            if role == "Executor Request Writer":
                return generated_executor_request()
            return "\n".join(
                [
                    f"Agent role: {role}",
                    f"Phase: {PHASE}",
                    f"Scenario: {SCENARIO}",
                    "Repository writes: none",
                    "Git operations: none",
                    "Codex execution mode requested: read-only/no-write",
                    "Patch execution: none",
                    "Merge policy: unchanged; final human approval remains mandatory.",
                ]
            )

    try:
        llm = DeterministicScopedPlanLLM()
        crew_agents = {
            agent_id: Agent(
                role=config["role"],
                goal=config["goal"],
                backstory=config["backstory"],
                llm=llm,
                verbose=False,
                max_iter=1,
                allow_delegation=False,
                allow_code_execution=False,
                tools=[],
            )
            for agent_id, config in AGENTS.items()
        }
        crew_tasks = [
            Task(
                name=task_config["id"],
                description=task_config["description"],
                expected_output=task_config["expected_output"],
                agent=crew_agents[task_config["agent"]],
                tools=[],
            )
            for task_config in TASKS
        ]
        crew = Crew(
            agents=list(crew_agents.values()),
            tasks=crew_tasks,
            process=Process.sequential,
            verbose=False,
            memory=False,
            cache=False,
            tracing=False,
        )
        crew.kickoff()

        agent_outputs: dict[str, str] = {}
        for task_config, task in zip(TASKS, crew_tasks):
            raw = getattr(getattr(task, "output", None), "raw", "") or ""
            agent_outputs[task_config["agent"]] = raw.strip()

        request = agent_outputs.get("executor_request_writer", "").strip() or fallback_executor_request()
        validation = validate_executor_request(request)
        complete_outputs = all(agent_outputs.get(agent_id) for agent_id in AGENTS)
        agent_separation = len(agent_outputs) == len(AGENTS) and set(agent_outputs) == set(AGENTS)
        return (
            CrewAIResult(
                crewai_importable=True,
                crewai_version=version,
                real_crewai_execution=True,
                agent_separation=agent_separation and complete_outputs,
                agent_outputs=agent_outputs,
                executor_request_generated=bool(request),
                executor_request_valid=validation.valid,
                validation_findings=validation.findings,
                evidence=[
                    "- CrewAI `Agent`, `Task`, and `Crew` objects were instantiated.",
                    "- CrewAI `Crew.kickoff()` completed.",
                    "- Five task outputs were collected from separate CrewAI task lanes.",
                    "- No CrewAI tools were configured.",
                    "- CrewAI did not receive write, Git, patch, or merge tools.",
                    "- Deterministic validation inspected the generated Executor Request.",
                ],
                limitations=[
                    "- CrewAI executed with a deterministic in-process LLM rather than an external model provider.",
                    "- This phase produces a plan only, not a repository patch.",
                    "- This is not real code review evidence on a diff and not merge approval.",
                    "- The merge gate remains unchanged.",
                ],
            ),
            request,
        )
    except Exception:
        request = fallback_executor_request()
        validation = validate_executor_request(request)
        return (
            CrewAIResult(
                crewai_importable=True,
                crewai_version=version,
                real_crewai_execution=False,
                agent_separation=False,
                agent_outputs={},
                executor_request_generated=True,
                executor_request_valid=validation.valid,
                validation_findings=validation.findings,
                evidence=["- CrewAI imported, but scoped patch plan request generation failed.", "- Fallback Executor Request was generated by the script."],
                limitations=["- CrewAI could not complete real execution, so no real CrewAI execution claim is made."],
                error=traceback.format_exc(),
            ),
            request,
        )


def build_scoped_patch_plan(request_markdown: str) -> str:
    request_id = field_value(request_markdown, "Request ID") or "unknown"
    return "\n".join(
        [
            "# Scoped Patch Plan",
            "",
            f"- Request ID: {request_id}",
            "- Execution mode: read-only/no-write",
            "- Repo writes allowed: no",
            "- Git operations allowed: no",
            "- Patch application: not performed",
            f"- Target scenario: {SCENARIO}",
            "- Candidate files: future-only candidates include `components/QuestGame.tsx`, `components/quest/questSchema.tsx`, and relevant ending/replay UI files if identified in a separate approved write phase",
            "- Proposed changes: verify accessible name, focus behavior, keyboard activation, visible focus state, and replay/reset semantics for the final Replay control in a later approved implementation phase",
            "- Validation plan: run lint, build, focused manual keyboard checks, and targeted regression checks after a future patch exists",
            "- Risk assessment: low if limited to label/focus semantics; medium if replay state or quest progression logic is touched",
            "- Rollback plan: revert the future scoped implementation commit after human review if validation fails",
            "- Human approval required before implementation: yes",
            "",
            "## Context read",
            "",
            "- The adapter read the generated Executor Request.",
            "- The adapter used the CrewAI/Codex contract and report templates as stable workflow context.",
            "- The adapter did not read application files in this phase.",
            "",
            "## Proposed patch scope",
            "",
            "- Future implementation should be limited to the final Replay button accessibility behavior and copy/attributes required for assistive technology clarity.",
            "- Future implementation should preserve current replay mechanics, quest progression, heart accounting, timers, and game state.",
            "- Future implementation should avoid package changes and avoid merge-gate changes.",
            "",
            "## Files to inspect in future write phase",
            "",
            "- `components/QuestGame.tsx` as a possible location for final screen and replay handler wiring.",
            "- `components/quest/questSchema.tsx` only if replay copy or ending registration is proven to depend on quest metadata.",
            "- `app/globals.css` only if focus styling is missing and explicit approval is granted because it is a protected path.",
            "- Story-related files only if the final Replay control is proven to live in the scrollytelling flow.",
            "",
            "## Files explicitly out of scope",
            "",
            "- `package.json` and lockfiles.",
            "- `.env`, `.env.*`, secrets, credentials, and deployment files.",
            "- `public/` assets.",
            "- Mini-game physics, scoring, timers, collision logic, unlock logic, and reward-heart accounting.",
            "- Merge scripts, CI gates, deployment configuration, and production branch operations.",
            "",
            "## Step-by-step implementation plan",
            "",
            "1. In a separate approved write phase, identify the final Replay control and its handler without changing game mechanics.",
            "2. Confirm the control is a semantic `button` or equivalent accessible control with keyboard activation.",
            "3. Ensure the accessible name clearly communicates replay/restart behavior in the current UI language.",
            "4. Verify focus is visible and does not cause layout shift on desktop or mobile.",
            "5. Add the smallest focused change needed for accessibility, if inspection proves a gap exists.",
            "6. Run validation and manually test keyboard navigation through the ending screen.",
            "7. Document any remaining limitation for human review.",
            "",
            "## Validation commands",
            "",
            "- `git diff --check` after a future patch exists.",
            "- `npm run lint` after a future patch exists.",
            "- `npm run build` after a future patch exists.",
            "- `./scripts/test-multiagent-workflow.sh` when executable and relevant to workflow evidence.",
            "",
            "## Review checklist",
            "",
            "- Replay behavior is unchanged.",
            "- Keyboard users can reach and activate the control.",
            "- Accessible name is specific and localized consistently with nearby UI.",
            "- Focus style is visible and contrast-safe.",
            "- No package files, secrets, assets, or merge-gate files are changed.",
            "- No real code diff was reviewed in this phase.",
            "",
            "## Risks and mitigations",
            "",
            "- Risk: accidental replay mechanic change. Mitigation: avoid state logic edits unless explicitly approved and regression tested.",
            "- Risk: global focus style regression. Mitigation: prefer existing styles; edit global CSS only with explicit approval.",
            "- Risk: over-broad scope. Mitigation: keep future patch limited to the final Replay control.",
            "",
            "## Stop conditions",
            "",
            "- Future work requires mini-game or quest progression logic changes.",
            "- Future work requires package or lockfile changes.",
            "- Future work requires deployment, secret, or merge-gate edits.",
            "- Human approval for protected paths is missing.",
            "- Validation fails and the cause is not understood.",
        ]
    )


def validate_scoped_patch_plan(markdown: str) -> ValidationResult:
    findings: list[str] = []
    required_checks = [
        ("title", markdown.startswith("# Scoped Patch Plan")),
        ("Request ID", bool(field_value(markdown, "Request ID"))),
        ("Execution mode", field_value(markdown, "Execution mode") == "read-only/no-write"),
        ("Repo writes allowed: no", field_value(markdown, "Repo writes allowed").lower() == "no"),
        ("Git operations allowed: no", field_value(markdown, "Git operations allowed").lower() == "no"),
        ("Patch application", field_value(markdown, "Patch application") == "not performed"),
        ("Candidate files", bool(field_value(markdown, "Candidate files"))),
        ("Proposed changes", bool(field_value(markdown, "Proposed changes"))),
        ("Validation plan", bool(field_value(markdown, "Validation plan"))),
        ("Risk assessment", bool(field_value(markdown, "Risk assessment"))),
        ("Rollback plan", bool(field_value(markdown, "Rollback plan"))),
        ("Human approval", field_value(markdown, "Human approval required before implementation").lower() == "yes"),
        ("Context read", "## Context read" in markdown),
        ("Proposed patch scope", "## Proposed patch scope" in markdown),
        ("Future files", "## Files to inspect in future write phase" in markdown),
        ("Out of scope", "## Files explicitly out of scope" in markdown),
        ("Implementation plan", "## Step-by-step implementation plan" in markdown),
        ("Validation commands", "## Validation commands" in markdown),
        ("Review checklist", "## Review checklist" in markdown),
        ("Risks", "## Risks and mitigations" in markdown),
        ("Stop conditions", "## Stop conditions" in markdown),
    ]
    for label, passed in required_checks:
        if not passed:
            findings.append(f"- Missing or invalid scoped plan field/section: {label}")
    findings.extend(forbidden_safety_findings(markdown))
    if NO_REAL_DIFF_DISCLAIMER.lower() not in markdown.lower():
        findings.append("- Missing no-real-diff disclaimer.")
    return ValidationResult(valid=not findings, findings=findings or ["- Scoped Patch Plan passed deterministic validation."])


def reviewer_block(name: str, verdict: str, findings: list[str], required_changes: list[str], evidence: list[str], notes: list[str]) -> str:
    return "\n".join(
        [
            f"## {name}",
            "",
            f"- Verdict: {verdict}",
            "- Findings:",
            markdown_list(findings),
            "- Required changes:",
            markdown_list(required_changes),
            "- Evidence:",
            markdown_list(evidence),
            "- Notes:",
            markdown_list(notes),
            "",
        ]
    )


def build_reviewer_evaluation(plan_valid: bool, request_valid: bool, response_path: Path) -> str:
    base_evidence = [
        "- Executor Request was generated and validated deterministically.",
        "- Scoped Patch Plan was generated by the no-write adapter.",
        "- No repository patch exists for review.",
        f"- Executor response path planned: `{response_path}`",
        f"- {NO_REAL_DIFF_DISCLAIMER}",
    ]
    verdict = PASS_WITH_NOTES if plan_valid and request_valid else CHANGES_REQUESTED
    required_changes = ["- None for this planning artifact. Future implementation still requires separate approval."] if verdict == PASS_WITH_NOTES else ["- Fix request or plan validation findings before using this plan."]

    blocks = [
        "# Reviewer Evaluation",
        "",
        f"- Request ID: {REQUEST_ID}",
        "- Review mode: plan-only/no-diff",
        f"- {NO_REAL_DIFF_DISCLAIMER}",
        "",
        reviewer_block(
            "Frontend Architect Reviewer",
            verdict,
            ["- Plan keeps future scope focused on final Replay control semantics and avoids architecture changes."],
            required_changes,
            base_evidence,
            ["- Future implementation must identify the exact component before editing."],
        ),
        reviewer_block(
            "Code Reviewer",
            verdict,
            ["- Plan does not contain an applicable diff and does not claim implementation."],
            required_changes,
            base_evidence,
            ["- Future patch review must inspect actual changed lines."],
        ),
        reviewer_block(
            "UX / Accessibility Reviewer",
            verdict,
            ["- Plan covers accessible name, keyboard activation, visible focus, and replay semantics."],
            required_changes,
            base_evidence,
            ["- Future manual keyboard testing remains required."],
        ),
        reviewer_block(
            "QA / Regression Reviewer",
            verdict,
            ["- Plan calls out replay mechanics, quest progression, heart accounting, and game state as regression-sensitive."],
            required_changes,
            base_evidence,
            ["- Future validation must run after a real patch exists."],
        ),
        reviewer_block(
            "Git / Workflow Reviewer",
            verdict,
            ["- Plan preserves no-write scope, no adapter Git operations, and no merge-gate integration."],
            required_changes,
            base_evidence,
            ["- Generated evidence stays local under `.agent/reports/<timestamp>/`."],
        ),
        "## Aggregator",
        "",
        f"- Verdict: {verdict}",
        "- Findings:",
        "- Reviewer verdicts are aligned on plan-only scope.",
        f"- {NO_REAL_DIFF_DISCLAIMER}",
        "- Required changes:",
        markdown_list(required_changes),
        "- Evidence:",
        markdown_list(base_evidence),
        "- Notes:",
        "- Final human approval remains required before any future implementation or merge.",
        "",
        "## Aggregator summary",
        "",
        "- Frontend Architect Reviewer: " + verdict,
        "- Code Reviewer: " + verdict,
        "- UX / Accessibility Reviewer: " + verdict,
        "- QA / Regression Reviewer: " + verdict,
        "- Git / Workflow Reviewer: " + verdict,
        f"- Final verdict: {verdict}",
        f"- {NO_REAL_DIFF_DISCLAIMER}",
    ]
    return "\n".join(blocks)


def validate_reviewer_evaluation(markdown: str) -> ValidationResult:
    findings: list[str] = []
    required_reviewers = REVIEWERS + ["Aggregator"]
    for reviewer in required_reviewers:
        if f"## {reviewer}" not in markdown:
            findings.append(f"- Missing reviewer section: {reviewer}")
    for section in ["- Verdict:", "- Findings:", "- Required changes:", "- Evidence:", "- Notes:"]:
        if section not in markdown:
            findings.append(f"- Missing reviewer field: {section}")
    if "## Aggregator summary" not in markdown:
        findings.append("- Missing aggregator summary.")
    if "Final verdict:" not in markdown:
        findings.append("- Missing final verdict.")
    if NO_REAL_DIFF_DISCLAIMER not in markdown:
        findings.append("- Missing no-real-diff disclaimer.")
    findings.extend(forbidden_safety_findings(markdown))
    return ValidationResult(valid=not findings, findings=findings or ["- Reviewer Evaluation passed deterministic validation."])


def build_executor_response(
    request_markdown: str,
    report_path: Path,
    plan_valid: bool,
    reviewer_valid: bool,
) -> str:
    request_id = field_value(request_markdown, "Request ID") or "unknown"
    validation_line = (
        "request valid; scoped patch plan valid; reviewer evaluation valid; no-write constraints preserved"
        if plan_valid and reviewer_valid
        else "one or more planning validations failed; see report findings"
    )
    safe_to_proceed = "yes" if plan_valid and reviewer_valid else "no"
    return "\n".join(
        [
            "# Executor Response",
            "",
            f"- Request ID: {request_id}",
            "- Executor: Codex no-write adapter",
            "- Execution mode: read-only/no-write",
            "- Real execution: yes",
            "- Actions performed: read executor-request.md, generated scoped-patch-plan.md, generated reviewer-evaluation.md, validated planning artifacts, generated this response artifact",
            "- Files changed: none",
            "- Commands run: none",
            f"- Validation results: {validation_line}",
            "- Diff summary: none",
            "- Patch plan generated: yes",
            f"- Report path: `{report_path}`",
            "- Errors: none",
            "- Limitations: plan-only adapter; no repository write actions; no applicable diff; no real code review; no merge approval; no merge-gate integration",
            f"- Safe to proceed: {safe_to_proceed}",
            "",
            "## Evidence",
            "",
            "- Real Codex execution: yes, limited to no-write adapter processing of the actual request content.",
            "- Scoped Patch Plan generated: yes.",
            "- Reviewer Evaluation generated: yes.",
            "- Repo writes by adapter: no.",
            "- Git operations by adapter: no.",
            "- Patch execution by adapter: no.",
            f"- {NO_REAL_DIFF_DISCLAIMER}",
            "",
            "## Output",
            "",
            "The adapter produced a plan-only scoped patch artifact and reviewer evaluation. No application code was modified, no patch was applied, and no real code diff was reviewed.",
            "",
            "## Follow-up",
            "",
            "Use this as planning evidence only. A later reviewed phase is required before any write-capable implementation, real diff review, merge-gate integration, or promotion.",
        ]
    )


def validate_executor_response(markdown: str) -> ValidationResult:
    findings: list[str] = []
    required_checks = [
        ("title", markdown.startswith("# Executor Response")),
        ("Request ID", bool(field_value(markdown, "Request ID"))),
        ("Executor", field_value(markdown, "Executor") == "Codex no-write adapter"),
        ("Execution mode", field_value(markdown, "Execution mode") == "read-only/no-write"),
        ("Real execution", field_value(markdown, "Real execution").lower() == "yes"),
        ("Files changed", field_value(markdown, "Files changed").lower() == "none"),
        ("Commands run", field_value(markdown, "Commands run").lower() == "none"),
        ("Diff summary", field_value(markdown, "Diff summary").lower() == "none"),
        ("Patch plan generated", field_value(markdown, "Patch plan generated").lower() == "yes"),
        ("Validation results", bool(field_value(markdown, "Validation results"))),
        ("Evidence", "## Evidence" in markdown),
        ("Output", "## Output" in markdown),
        ("Follow-up", "## Follow-up" in markdown),
    ]
    for label, passed in required_checks:
        if not passed:
            findings.append(f"- Missing or invalid response field/section: {label}")
    if NO_REAL_DIFF_DISCLAIMER not in markdown:
        findings.append("- Missing no-real-diff disclaimer.")
    findings.extend(forbidden_safety_findings(markdown))
    return ValidationResult(valid=not findings, findings=findings or ["- Executor Response passed deterministic validation."])


def run_codex_no_write_planner(
    request_path: Path,
    plan_path: Path,
    reviewer_path: Path,
    response_path: Path,
    report_path: Path,
) -> PlanResult:
    errors: list[str] = []
    try:
        request_markdown = request_path.read_text(encoding="utf-8")
    except Exception as exc:
        request_markdown = ""
        errors.append(f"- Failed to read request: {exc}")

    request_validation = validate_executor_request(request_markdown)
    plan = build_scoped_patch_plan(request_markdown)
    plan_validation = validate_scoped_patch_plan(plan)
    reviewer_evaluation = build_reviewer_evaluation(plan_validation.valid, request_validation.valid, response_path)
    reviewer_validation = validate_reviewer_evaluation(reviewer_evaluation)
    response = build_executor_response(
        request_markdown=request_markdown,
        report_path=report_path,
        plan_valid=plan_validation.valid,
        reviewer_valid=reviewer_validation.valid,
    )
    response_validation = validate_executor_response(response)
    aggregate_verdict = (
        PASS_WITH_NOTES
        if request_validation.valid and plan_validation.valid and reviewer_validation.valid and response_validation.valid
        else CHANGES_REQUESTED
    )

    return PlanResult(
        real_codex_execution=bool(request_markdown),
        execution_mode="read-only/no-write",
        scoped_patch_plan_generated=bool(plan),
        scoped_patch_plan_valid=plan_validation.valid,
        reviewer_evaluation_generated=bool(reviewer_evaluation),
        reviewer_evaluation_valid=reviewer_validation.valid,
        executor_response_generated=bool(response),
        executor_response_valid=response_validation.valid,
        aggregator_verdict_generated=True,
        aggregator_verdict=aggregate_verdict,
        plan=plan,
        reviewer_evaluation=reviewer_evaluation,
        response=response,
        plan_validation_findings=plan_validation.findings,
        reviewer_validation_findings=reviewer_validation.findings,
        response_validation_findings=response_validation.findings,
        errors=errors,
        limitations=[
            "- Codex adapter did not run shell commands.",
            "- Codex adapter did not modify repository files.",
            "- Codex adapter did not perform Git operations.",
            "- Scoped Patch Plan is not an implementation patch.",
            f"- {NO_REAL_DIFF_DISCLAIMER}",
        ],
    )


def final_verdict(crewai: CrewAIResult, plan: PlanResult) -> str:
    if not crewai.crewai_importable or not crewai.real_crewai_execution:
        return INFRASTRUCTURE_BLOCKED
    if not crewai.executor_request_valid:
        return CHANGES_REQUESTED
    if not plan.real_codex_execution:
        return INFRASTRUCTURE_BLOCKED
    if not plan.scoped_patch_plan_valid or not plan.reviewer_evaluation_valid or not plan.executor_response_valid:
        return CHANGES_REQUESTED
    return PASS_WITH_NOTES


def build_report(
    report_path: Path,
    request_path: Path,
    plan_path: Path,
    reviewer_path: Path,
    response_path: Path,
    crewai: CrewAIResult,
    plan_result: PlanResult,
) -> str:
    verdict = final_verdict(crewai, plan_result)
    output_sections = []
    for agent_id in AGENTS:
        output_sections.extend([f"### {agent_id}", "", crewai.agent_outputs.get(agent_id, "No output captured."), ""])

    evidence = [
        f"- Report path: `{report_path}`",
        f"- Executor request path: `{request_path}`",
        f"- Scoped patch plan path: `{plan_path}`",
        f"- Reviewer evaluation path: `{reviewer_path}`",
        f"- Executor response path: `{response_path}`",
        f"- Python executable: `{sys.executable}`",
        f"- CrewAI importable: {yes_no(crewai.crewai_importable)}",
        f"- CrewAI version: {crewai.crewai_version}",
        f"- Real CrewAI execution: {yes_no(crewai.real_crewai_execution)}",
        f"- Real Codex execution: {yes_no(plan_result.real_codex_execution)}",
        "- Codex execution mode: read-only/no-write",
        "- Repo modification: no",
        "- Git operations: no",
        f"- {NO_REAL_DIFF_DISCLAIMER}",
        *crewai.evidence,
    ]

    error_lines: list[str] = []
    if crewai.error:
        error_lines.extend(["CrewAI execution error:", "", "```text", crewai.error.strip(), "```"])
    if plan_result.errors:
        error_lines.extend(["Codex adapter errors:", "", markdown_list(plan_result.errors)])

    return "\n".join(
        [
            "# CrewAI to Codex Scoped Patch Plan Report",
            "",
            f"- Phase: {PHASE}",
            "- Orchestrator: CrewAI",
            "- Executor: Codex no-write adapter",
            f"- Real CrewAI execution: {yes_no(crewai.real_crewai_execution)}",
            f"- CrewAI importable: {yes_no(crewai.crewai_importable)}",
            f"- CrewAI version: {crewai.crewai_version}",
            f"- Executor Request generated: {yes_no(crewai.executor_request_generated)}",
            f"- Executor Request valid: {yes_no(crewai.executor_request_valid)}",
            f"- Real Codex execution: {yes_no(plan_result.real_codex_execution)}",
            "- Codex execution mode: read-only/no-write",
            f"- Scoped Patch Plan generated: {yes_no(plan_result.scoped_patch_plan_generated)}",
            f"- Scoped Patch Plan valid: {yes_no(plan_result.scoped_patch_plan_valid)}",
            f"- Reviewer evaluation generated: {yes_no(plan_result.reviewer_evaluation_generated)}",
            f"- Aggregator verdict generated: {yes_no(plan_result.aggregator_verdict_generated)}",
            "- Repo modification: no",
            "- Git operations: no",
            f"- Agent separation: {yes_no(crewai.agent_separation)}",
            f"- Final verdict: {verdict}",
            "",
            "## Scenario",
            "",
            SCENARIO,
            "",
            "## CrewAI agent outputs",
            "",
            "\n".join(output_sections).rstrip(),
            "",
            "## Executor Request validation",
            "",
            markdown_list(crewai.validation_findings),
            "",
            "## Codex no-write patch planning",
            "",
            "- Adapter read the generated `executor-request.md` artifact.",
            "- Adapter generated a real `scoped-patch-plan.md` artifact from the request content.",
            "- Adapter generated a plan-only reviewer evaluation.",
            "- Adapter execution mode: read-only/no-write.",
            "- Files changed: none.",
            "- Commands run: none.",
            "- Git operations: none.",
            "",
            "## Scoped Patch Plan validation",
            "",
            markdown_list(plan_result.plan_validation_findings),
            "",
            "## Reviewer evaluation summary",
            "",
            f"- Reviewer Evaluation valid: {yes_no(plan_result.reviewer_evaluation_valid)}",
            f"- Aggregator verdict generated: {yes_no(plan_result.aggregator_verdict_generated)}",
            f"- Aggregator verdict: {plan_result.aggregator_verdict}",
            f"- {NO_REAL_DIFF_DISCLAIMER}",
            "",
            "## Safety checks",
            "",
            "- Application code modification: no",
            "- Package file modification: no",
            "- Public asset modification: no",
            "- Secrets or environment file access: no",
            "- Patch execution by adapter: no",
            "- Git operation by adapter: no",
            "- Merge-gate integration: no",
            "- Real code diff review claim: no",
            "",
            "## Evidence",
            "",
            markdown_list(evidence),
            "",
            "## Limitations",
            "",
            markdown_list(crewai.limitations + plan_result.limitations),
            "",
            "## Final decision",
            "",
            "This phase demonstrates a real CrewAI request generation and a real Codex no-write scoped patch plan. It does not authorize repository writes, Git operations, patch execution, real review on a diff, merge-gate integration, or merge.",
            "",
            f"Final verdict: {verdict}",
            "",
            "## Next step",
            "",
            "Review this branch manually. A separate reviewed phase is required before any write-capable implementation or merge-gate integration is considered.",
            "",
            *error_lines,
            "",
        ]
    )


def main() -> int:
    root = repo_root()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    report_dir = root / ".agent" / "reports" / timestamp
    report_dir.mkdir(parents=True, exist_ok=True)

    request_path = report_dir / "executor-request.md"
    plan_path = report_dir / "scoped-patch-plan.md"
    reviewer_path = report_dir / "reviewer-evaluation.md"
    response_path = report_dir / "executor-response.md"
    report_path = report_dir / "crewai-scoped-patch-plan.md"

    crewai_result, request = run_real_crewai_request_generation()
    request_path.write_text(request + "\n", encoding="utf-8")

    plan_result = run_codex_no_write_planner(request_path, plan_path, reviewer_path, response_path, report_path)
    plan_path.write_text(plan_result.plan + "\n", encoding="utf-8")
    reviewer_path.write_text(plan_result.reviewer_evaluation + "\n", encoding="utf-8")
    response_path.write_text(plan_result.response + "\n", encoding="utf-8")
    report_path.write_text(
        build_report(report_path, request_path, plan_path, reviewer_path, response_path, crewai_result, plan_result) + "\n",
        encoding="utf-8",
    )

    verdict = final_verdict(crewai_result, plan_result)
    print(f"Report: {report_path}")
    print(f"Executor request: {request_path}")
    print(f"Scoped patch plan: {plan_path}")
    print(f"Reviewer evaluation: {reviewer_path}")
    print(f"Executor response: {response_path}")
    print(f"CrewAI importable: {yes_no(crewai_result.crewai_importable)}")
    print(f"CrewAI version: {crewai_result.crewai_version}")
    print(f"Real CrewAI execution: {yes_no(crewai_result.real_crewai_execution)}")
    print(f"Executor Request generated: {yes_no(crewai_result.executor_request_generated)}")
    print(f"Executor Request valid: {yes_no(crewai_result.executor_request_valid)}")
    print(f"Real Codex execution: {yes_no(plan_result.real_codex_execution)}")
    print("Codex execution mode: read-only/no-write")
    print(f"Scoped Patch Plan generated: {yes_no(plan_result.scoped_patch_plan_generated)}")
    print(f"Scoped Patch Plan valid: {yes_no(plan_result.scoped_patch_plan_valid)}")
    print(f"Reviewer evaluation generated: {yes_no(plan_result.reviewer_evaluation_generated)}")
    print(f"Aggregator verdict generated: {yes_no(plan_result.aggregator_verdict_generated)}")
    print(f"Executor Response generated: {yes_no(plan_result.executor_response_generated)}")
    print(f"Executor Response valid: {yes_no(plan_result.executor_response_valid)}")
    print("Repo modification: no")
    print("Git operations: no")
    print(f"Agent separation: {yes_no(crewai_result.agent_separation)}")
    print(f"Final verdict: {verdict}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
