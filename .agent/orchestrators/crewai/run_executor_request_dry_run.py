#!/usr/bin/env python3
"""Run a safe CrewAI Executor Request dry-run and write evidence reports.

This script tests only the orchestration-to-request handoff:
CrewAI -> structured Executor Request -> deterministic validation -> report.

It does not execute Codex, modify application code, run Git operations, commit,
push, merge, or connect CrewAI to the merge gate. It writes evidence under
.agent/reports/<timestamp>/.
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


PHASE = "Fase 5e — CrewAI Executor Request Dry-Run"
SCENARIO = (
    "Preparare una richiesta per Codex per valutare una futura modifica accessibile "
    "al pulsante finale Replay nel componente finale, senza modificare il repository."
)
REQUEST_ID = "phase-5e-replay-button-a11y-request-001"

CANONICAL_PASS_WITH_NOTES = "PASS WITH NOTES"
CANONICAL_CHANGES_REQUESTED = "CHANGES REQUESTED"
CANONICAL_INFRASTRUCTURE_BLOCKED = "INFRASTRUCTURE BLOCKED"

AGENTS = {
    "request_planner": {
        "role": "Executor Request Planner",
        "goal": "Plan a safe no-write request for Codex",
        "backstory": "You define a narrow executor request without asking for repository writes.",
    },
    "scope_guardian": {
        "role": "Scope Guardian",
        "goal": "Enforce forbidden files, commands, and Git restrictions",
        "backstory": "You prevent app code edits, package changes, and Git operations.",
    },
    "executor_request_writer": {
        "role": "Executor Request Writer",
        "goal": "Write the final markdown Executor Request",
        "backstory": "You produce a structured request that follows the SITE LOVE executor contract.",
    },
    "contract_reviewer": {
        "role": "Contract Reviewer",
        "goal": "Review the generated request against the executor contract",
        "backstory": "You check required fields, no-write policy, and report evidence expectations.",
    },
    "aggregator": {
        "role": "Dry-Run Aggregator",
        "goal": "Aggregate the dry-run evidence into a canonical verdict",
        "backstory": "You preserve limitations and never approve merge or real review.",
    },
}

TASKS = [
    {
        "id": "plan_executor_request",
        "agent": "request_planner",
        "description": (
            "Plan a no-write Executor Request for Codex for the Replay button "
            "accessibility scenario. Do not request repository modification."
        ),
        "expected_output": "A concise safe request plan with no repository writes.",
    },
    {
        "id": "guard_scope",
        "agent": "scope_guardian",
        "description": (
            "Verify that the planned request forbids app code writes, package changes, "
            "Git operations, merge-gate integration, and global dependency installs."
        ),
        "expected_output": "Scope guard notes and explicit forbidden operations.",
    },
    {
        "id": "write_executor_request",
        "agent": "executor_request_writer",
        "description": (
            "Write a complete markdown Executor Request that follows the Fase 5e "
            "template. Repo writes allowed must be no. Git operations allowed must be no."
        ),
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
        "agent": "aggregator",
        "description": (
            "Aggregate the request dry-run output. Do not claim Codex execution, "
            "real review, repository modification, or merge approval."
        ),
        "expected_output": "A canonical verdict recommendation.",
    },
]


@dataclass
class ValidationResult:
    valid: bool
    findings: list[str]


@dataclass
class DryRunResult:
    crewai_importable: bool
    crewai_version: str
    real_crewai_execution: bool
    agent_separation: bool
    agent_outputs: dict[str, str]
    executor_request_generated: bool
    executor_request_valid: bool
    executor_response_generated: bool
    final_verdict: str
    validation_findings: list[str]
    evidence: list[str]
    limitations: list[str]
    error: str = ""


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def crewai_version() -> str:
    try:
        return importlib.metadata.version("crewai")
    except importlib.metadata.PackageNotFoundError:
        return "unknown"


def markdown_list(lines: list[str]) -> str:
    return "\n".join(lines) if lines else "- None recorded."


def generated_executor_request() -> str:
    return "\n".join(
        [
            "# Executor Request",
            "",
            f"- Request ID: {REQUEST_ID}",
            "- Requested by agent: CrewAI Executor Request Writer",
            "- Intended executor: Codex",
            f"- Phase: {PHASE}",
            "- Task: Evaluate a future accessible improvement to the final Replay button without changing repository files.",
            "- Scope: Plan-only inspection request for a future accessibility evaluation. Codex must not edit files, stage changes, commit, push, merge, or modify the merge gate.",
            "- Files allowed: `.agent/contracts/crewai-codex-executor-contract.md`, `.agent/contracts/executor-request-template.md`, `.agent/contracts/examples/replay-button-executor-request.md`, `.agent/orchestrators/crewai/README.md`",
            "- Files forbidden: `app/`, `components/`, `lib/`, `public/`, `package.json`, `package-lock.json`, `.env`, `.env.*`, deployment files, secrets, credentials",
            '- Commands allowed: `pwd`, `rg "Replay|Rigioca|restart" .agent docs AGENTS.md`, `sed -n \'1,160p\' .agent/contracts/crewai-codex-executor-contract.md`',
            "- Commands forbidden: repository writes, dependency installation, deployment commands, branch deletion, commit, push, merge, force push, reset, checkout file restore",
            "- Repo writes allowed: no",
            "- Git operations allowed: no",
            "- Expected output: A plan-only accessibility assessment request summary, files that would require explicit approval before future editing, and a no-op Executor Response if requested.",
            "- Required evidence: Files inspected, commands run, validation result, scope limitations, and confirmation that no files were changed.",
            "- Safety constraints: No repository writes. No Codex patch execution. No real review claim. No merge-gate integration. No package file changes. No secrets or environment file access.",
            "- Human approval required before: Any repository write, protected path edit, package change, Git operation, real Codex execution, merge-gate change, or promotion toward prod.",
            "",
            "## Context",
            "",
            SCENARIO,
            "",
            "The purpose is to validate whether CrewAI can produce a structured request for Codex under the executor contract. The request is intentionally plan-only and must not trigger any patch execution.",
            "",
            "## Requested action",
            "",
            "Codex should only review the allowed documentation context and describe what a future accessibility evaluation would need. Codex must not inspect forbidden files, modify files, run Git operations, or produce a real Executor Response in this dry-run.",
            "",
            "## Acceptance criteria",
            "",
            "- The request follows `.agent/contracts/executor-request-template.md`.",
            "- `Intended executor` is `Codex`.",
            "- `Repo writes allowed` is `no`.",
            "- `Git operations allowed` is `no`.",
            "- No application code, package files, secrets, or deployment files are allowed.",
            "- No real Codex execution or real review is claimed.",
            "- Output remains evidence for an orchestrator dry-run only.",
            "",
            "## Stop conditions",
            "",
            "- Working tree is dirty before execution.",
            "- The request asks for repository writes or Git operations.",
            "- The request allows `app/`, `components/`, `lib/`, `package.json`, or `package-lock.json` as editable scope.",
            "- The request asks Codex to commit, push, merge, delete branches, force push, install dependencies, deploy, edit secrets, or change the merge gate.",
            "- The request asks CrewAI output to count as real review evidence or merge approval.",
        ]
    )


def fallback_executor_request() -> str:
    return generated_executor_request().replace(
        "- Requested by agent: CrewAI Executor Request Writer",
        "- Requested by agent: fallback script because CrewAI did not execute",
    )


def no_op_executor_response() -> str:
    return "\n".join(
        [
            "# Executor Response",
            "",
            f"- Request ID: {REQUEST_ID}",
            "- Executor: none",
            "- Execution mode: no-op/example",
            "- Real execution: no",
            "- Actions performed: none",
            "- Files changed: none",
            "- Commands run: none",
            "- Validation results: not run by Codex; only the generated request was validated by the dry-run script",
            "- Diff summary: no diff from executor response; dry-run only",
            "- Report path: none",
            "- Errors: none",
            "- Limitations: Codex was not executed. This is not real review evidence and not merge approval.",
            "- Safe to proceed: no, dry-run only",
            "",
            "## Evidence",
            "",
            "No Codex execution evidence exists because this response is no-op/example output.",
            "",
            "## Output",
            "",
            "The only real execution in this phase is CrewAI orchestration and deterministic request validation.",
            "",
            "## Follow-up",
            "",
            "A future phase may test a real Codex executor handoff only after explicit approval and without changing the merge gate.",
        ]
    )


def field_value(markdown: str, field: str) -> str:
    pattern = rf"^- {re.escape(field)}:\s*(.*)$"
    match = re.search(pattern, markdown, flags=re.MULTILINE)
    return match.group(1).strip() if match else ""


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
        ("Stop conditions", "## Stop conditions" in markdown and bool(markdown.split("## Stop conditions", 1)[1].strip())),
    ]

    for label, passed in required_checks:
        if not passed:
            findings.append(f"- Missing or invalid required field/section: {label}")

    files_allowed = field_value(markdown, "Files allowed").lower()
    commands_allowed = field_value(markdown, "Commands allowed").lower()
    scope = field_value(markdown, "Scope").lower()
    requested_action = ""
    if "## Requested action" in markdown:
        requested_action = markdown.split("## Requested action", 1)[1].split("## Acceptance criteria", 1)[0].lower()

    forbidden_allowed_patterns = [
        ("git push", commands_allowed),
        ("git merge", commands_allowed),
        ("git branch -d", commands_allowed),
        ("git branch -D", commands_allowed),
        ("git push --force", commands_allowed),
        ("rm -rf", commands_allowed),
        ("package.json", files_allowed),
        ("package-lock.json", files_allowed),
    ]
    for pattern, haystack in forbidden_allowed_patterns:
        if pattern.lower() in haystack:
            findings.append(f"- Forbidden item appears in an allowed field: {pattern}")

    unsafe_intent_patterns = [
        "commit",
        "push",
        "merge",
        "force push",
        "delete branch",
        "install dependencies",
        "deploy",
        "edit secrets",
    ]
    for pattern in unsafe_intent_patterns:
        if pattern in requested_action and "must not" not in requested_action:
            findings.append(f"- Unsafe action appears in requested action: {pattern}")

    if "modify the merge gate" in scope and "must not" not in scope:
        findings.append("- Scope appears to allow merge-gate modification.")

    return ValidationResult(valid=not findings, findings=findings or ["- Executor Request passed deterministic validation."])


def run_real_crewai_request_dry_run() -> tuple[DryRunResult, str]:
    os.environ.setdefault("CREWAI_TRACING_ENABLED", "false")
    os.environ.setdefault("OTEL_SDK_DISABLED", "true")

    try:
        from crewai import Agent, Crew, Process, Task
        from crewai.llms.base_llm import BaseLLM
    except Exception:
        request = fallback_executor_request()
        validation = validate_executor_request(request)
        return (
            DryRunResult(
                crewai_importable=False,
                crewai_version="not importable",
                real_crewai_execution=False,
                agent_separation=False,
                agent_outputs={},
                executor_request_generated=True,
                executor_request_valid=validation.valid,
                executor_response_generated=True,
                final_verdict=CANONICAL_INFRASTRUCTURE_BLOCKED,
                validation_findings=validation.findings,
                evidence=["- CrewAI import failed.", "- Fallback Executor Request was generated by the script."],
                limitations=["- CrewAI did not execute, so this is infrastructure blocked."],
                error=traceback.format_exc(),
            ),
            request,
        )

    version = crewai_version()

    class DeterministicExecutorRequestLLM(BaseLLM):
        """Local deterministic LLM adapter for a no-provider CrewAI dry-run."""

        def __init__(self) -> None:
            super().__init__(model="site-love-deterministic-crewai-executor-request-dry-run")

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
                    "Codex execution: none",
                    "Safety finding: request generation may proceed only as a dry-run artifact.",
                    "Merge policy: no merge authorization; final human approval remains mandatory.",
                ]
            )

    try:
        llm = DeterministicExecutorRequestLLM()
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
        final_verdict = (
            CANONICAL_PASS_WITH_NOTES
            if complete_outputs and agent_separation and validation.valid
            else CANONICAL_CHANGES_REQUESTED
        )

        return (
            DryRunResult(
                crewai_importable=True,
                crewai_version=version,
                real_crewai_execution=True,
                agent_separation=agent_separation,
                agent_outputs=agent_outputs,
                executor_request_generated=bool(request),
                executor_request_valid=validation.valid,
                executor_response_generated=True,
                final_verdict=final_verdict,
                validation_findings=validation.findings,
                evidence=[
                    "- CrewAI `Agent`, `Task`, and `Crew` objects were instantiated.",
                    "- CrewAI `Crew.kickoff()` completed.",
                    "- Five task outputs were collected from separate CrewAI task lanes.",
                    "- No CrewAI tools were configured.",
                    "- No Codex executor was invoked.",
                    "- Deterministic validation inspected the generated Executor Request.",
                ],
                limitations=[
                    "- CrewAI executed with a deterministic in-process LLM rather than an external model provider.",
                    "- The Executor Response is no-op/example output only.",
                    "- Codex was not executed and no patch was applied.",
                    "- This dry-run is orchestration evidence, not real review evidence.",
                    "- The merge gate remains unchanged.",
                ],
            ),
            request,
        )
    except Exception:
        request = fallback_executor_request()
        validation = validate_executor_request(request)
        return (
            DryRunResult(
                crewai_importable=True,
                crewai_version=version,
                real_crewai_execution=False,
                agent_separation=False,
                agent_outputs={},
                executor_request_generated=True,
                executor_request_valid=validation.valid,
                executor_response_generated=True,
                final_verdict=CANONICAL_INFRASTRUCTURE_BLOCKED,
                validation_findings=validation.findings,
                evidence=["- CrewAI imported, but dry-run execution failed.", "- Fallback Executor Request was generated by the script."],
                limitations=["- CrewAI could not complete a real dry-run, so no real CrewAI execution claim is made."],
                error=traceback.format_exc(),
            ),
            request,
        )


def build_report(report_path: Path, request_path: Path, response_path: Path, result: DryRunResult) -> str:
    output_sections = []
    for agent_id in AGENTS:
        output_sections.extend(
            [
                f"### {agent_id}",
                "",
                result.agent_outputs.get(agent_id, "No output captured."),
                "",
            ]
        )

    evidence = [
        f"- Report path: `{report_path}`",
        f"- Executor request path: `{request_path}`",
        f"- Executor response path: `{response_path}`",
        f"- Python executable: `{sys.executable}`",
        f"- CrewAI importable: {'yes' if result.crewai_importable else 'no'}",
        f"- CrewAI version: {result.crewai_version}",
        f"- Real CrewAI execution: {'yes' if result.real_crewai_execution else 'no'}",
        "- Real Codex execution: no",
        "- Repo modification: no",
        "- Git operations: no",
        *result.evidence,
    ]

    error_block = ""
    if result.error:
        error_block = "\nExecution error:\n\n```text\n" + result.error.strip() + "\n```\n"

    return "\n".join(
        [
            "# CrewAI Executor Request Dry-Run Report",
            "",
            f"- Phase: {PHASE}",
            "- Orchestrator: CrewAI",
            f"- Real CrewAI execution: {'yes' if result.real_crewai_execution else 'no'}",
            f"- CrewAI importable: {'yes' if result.crewai_importable else 'no'}",
            f"- CrewAI version: {result.crewai_version}",
            f"- Executor Request generated: {'yes' if result.executor_request_generated else 'no'}",
            f"- Executor Request valid: {'yes' if result.executor_request_valid else 'no'}",
            "- Executor Response generated: no-op/example",
            "- Real Codex execution: no",
            "- Repo modification: no",
            "- Git operations: no",
            f"- Agent separation: {'yes' if result.agent_separation else 'no'}",
            f"- Final verdict: {result.final_verdict}",
            "",
            "## Scenario",
            "",
            SCENARIO,
            "",
            "## Agent outputs",
            "",
            "\n".join(output_sections).rstrip(),
            "",
            "## Executor Request validation",
            "",
            markdown_list(result.validation_findings),
            "",
            "## Safety checks",
            "",
            "- Codex execution: no",
            "- Repository writes: no",
            "- Git operations: no",
            "- Application code modification: no",
            "- Package file modification: no",
            "- Merge-gate integration: no",
            "- Executor Response type: no-op/example",
            "",
            "## Evidence",
            "",
            markdown_list(evidence),
            error_block.rstrip(),
            "",
            "## Limitations",
            "",
            markdown_list(result.limitations),
            "",
            "## Final decision",
            "",
            "CrewAI generated or attempted to generate a structured Executor Request. This dry-run does not execute Codex, does not modify repository files, does not run Git operations, and does not authorize merge.",
            "",
            f"Final verdict: {result.final_verdict}",
            "",
            "## Next step",
            "",
            "Review this branch manually. A later phase may test a real Codex executor handoff only after explicit approval and without changing the merge gate.",
            "",
        ]
    )


def main() -> int:
    root = repo_root()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    report_dir = root / ".agent" / "reports" / timestamp
    report_dir.mkdir(parents=True, exist_ok=True)

    result, request = run_real_crewai_request_dry_run()
    response = no_op_executor_response()

    request_path = report_dir / "executor-request.md"
    response_path = report_dir / "executor-response.md"
    report_path = report_dir / "crewai-executor-request-dry-run.md"

    request_path.write_text(request, encoding="utf-8")
    response_path.write_text(response, encoding="utf-8")
    report_path.write_text(build_report(report_path, request_path, response_path, result), encoding="utf-8")

    print(f"Report: {report_path}")
    print(f"Executor request: {request_path}")
    print(f"Executor response: {response_path}")
    print(f"CrewAI importable: {'yes' if result.crewai_importable else 'no'}")
    print(f"CrewAI version: {result.crewai_version}")
    print(f"Real CrewAI execution: {'yes' if result.real_crewai_execution else 'no'}")
    print(f"Executor Request generated: {'yes' if result.executor_request_generated else 'no'}")
    print(f"Executor Request valid: {'yes' if result.executor_request_valid else 'no'}")
    print("Executor Response generated: no-op/example")
    print("Real Codex execution: no")
    print("Repo modification: no")
    print("Git operations: no")
    print(f"Agent separation: {'yes' if result.agent_separation else 'no'}")
    print(f"Final verdict: {result.final_verdict}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
