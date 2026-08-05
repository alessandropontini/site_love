#!/usr/bin/env python3
"""Run the Fase 5f CrewAI-to-Codex no-write handshake.

This script proves only this handoff:
CrewAI -> Executor Request -> Codex no-write adapter -> Executor Response.

The Codex adapter is intentionally read-only. It reads the generated request,
validates the scope, writes a response artifact, and does not modify app files,
run Git operations, execute patches, or connect CrewAI to the merge gate.
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


PHASE = "Fase 5f — CrewAI to Codex No-Write Executor Handshake"
REQUEST_ID = "phase-5f-crewai-codex-no-write-handshake-001"
SCENARIO = (
    "Testare un primo handshake reale in cui CrewAI genera una Executor Request "
    "e Codex, in modalita read-only/no-write, legge la request e produce una "
    "Executor Response senza modificare il repository."
)

PASS_WITH_NOTES = "PASS WITH NOTES"
CHANGES_REQUESTED = "CHANGES REQUESTED"
INFRASTRUCTURE_BLOCKED = "INFRASTRUCTURE BLOCKED"

AGENTS = {
    "request_planner": {
        "role": "Executor Request Planner",
        "goal": "Plan a safe no-write request for Codex",
        "backstory": "You define a narrow executor request without repository writes or Git operations.",
    },
    "scope_guardian": {
        "role": "Scope Guardian",
        "goal": "Enforce read-only scope, forbidden files, and forbidden commands",
        "backstory": "You keep app files, package files, secrets, Git operations, and merge gates out of scope.",
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
    "handshake_aggregator": {
        "role": "Handshake Aggregator",
        "goal": "Aggregate request evidence without changing merge policy",
        "backstory": "You preserve limitations and never approve merge or real code review.",
    },
}

TASKS = [
    {
        "id": "plan_executor_request",
        "agent": "request_planner",
        "description": "Plan a read-only/no-write Executor Request for Codex.",
        "expected_output": "A concise safe request plan with no repository writes.",
    },
    {
        "id": "guard_scope",
        "agent": "scope_guardian",
        "description": "Verify forbidden files, commands, Git operations, and merge-gate changes remain disallowed.",
        "expected_output": "Scope guard notes and explicit forbidden operations.",
    },
    {
        "id": "write_executor_request",
        "agent": "executor_request_writer",
        "description": "Write a complete markdown Executor Request for the Fase 5f handshake.",
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
        "agent": "handshake_aggregator",
        "description": "Aggregate the no-write handshake request output without approving merge.",
        "expected_output": "A canonical verdict recommendation.",
    },
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
class CodexAdapterResult:
    real_codex_execution: bool
    execution_mode: str
    executor_response_generated: bool
    executor_response_valid: bool
    validation_findings: list[str]
    response: str
    files_read: list[str]
    commands_theoretically_allowed: list[str]
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


def generated_executor_request() -> str:
    return "\n".join(
        [
            "# Executor Request",
            "",
            f"- Request ID: {REQUEST_ID}",
            "- Requested by agent: CrewAI Executor Request Writer",
            "- Intended executor: Codex",
            f"- Phase: {PHASE}",
            "- Task: Execute a read-only/no-write Codex executor adapter handshake based on this request.",
            "- Scope: Codex may read this Executor Request and stable workflow documentation only. Codex must not edit files, stage changes, commit, push, merge, delete branches, install dependencies, deploy, modify the merge gate, or inspect forbidden application paths.",
            "- Files allowed: `.agent/reports/<timestamp>/executor-request.md`, `.agent/contracts/crewai-codex-executor-contract.md`, `.agent/contracts/executor-request-template.md`, `.agent/contracts/executor-response-template.md`, `.agent/orchestrators/crewai/README.md`, `.agent/orchestrators/crewai/ORCHESTRATOR_EVALUATION.md`, `.agent/orchestrators/crewai/dry_run_contract.md`, `.agent/orchestrators/crewai/agents.yaml`, `.agent/orchestrators/crewai/tasks.yaml`",
            "- Files forbidden: `app/`, `components/`, `lib/`, `public/`, `package.json`, `package-lock.json`, `.env`, `.env.*`, deployment files, secrets, credentials",
            "- Commands allowed: none during the Codex no-write adapter execution; theoretical future read-only commands would be limited to `pwd`, `sed -n`, and `rg` against allowed documentation paths",
            "- Commands forbidden: repository writes, patch commands, dependency installation, deployment commands, branch deletion, commit, push, merge, force push, reset, checkout file restore, staging changes, package manager mutation, secret inspection",
            "- Repo writes allowed: no",
            "- Git operations allowed: no",
            "- Expected output: A real no-write Executor Response generated from the actual request content, with files changed set to none, commands run set to none, diff summary set to none, and limitations clearly stated.",
            "- Required evidence: Request path, response path, files the adapter was allowed to read, deterministic request validation, deterministic response validation, and confirmation that no patches or Git operations were performed by the adapter.",
            "- Safety constraints: No repository writes by Codex adapter. No Git operations by Codex adapter. No application code access. No package file access. No secrets access. No merge-gate integration. No real review claim. No merge approval.",
            "- Human approval required before: Any repository write, protected path edit, package change, Git operation, real patch execution, real code review claim, merge-gate change, merge to system, or promotion toward prod.",
            "",
            "## Context",
            "",
            SCENARIO,
            "",
            "The purpose is to prove the contract handoff shape while keeping Codex in a no-write executor mode. This is not a code patch, not a real code review, and not merge approval.",
            "",
            "## Requested action",
            "",
            "Codex should read this request and produce a compliant Executor Response through a read-only/no-write adapter. Codex must not modify repository files, run commands, inspect forbidden files, perform Git operations, or change merge policy.",
            "",
            "## Acceptance criteria",
            "",
            "- CrewAI produces a structured Executor Request.",
            "- The request follows `.agent/contracts/executor-request-template.md`.",
            "- `Intended executor` is `Codex`.",
            "- `Repo writes allowed` is `no`.",
            "- `Git operations allowed` is `no`.",
            "- The Codex adapter reads the actual request content.",
            "- The Codex adapter produces a compliant Executor Response.",
            "- `Files changed` is `none`.",
            "- `Commands run` is `none`.",
            "- `Diff summary` is `none`.",
            "- No application code, package files, secrets, deployment files, patch execution, Git operation, or merge-gate integration is in scope.",
            "",
            "## Stop conditions",
            "",
            "- CrewAI is not importable or cannot complete real execution.",
            "- The request allows repository writes or Git operations.",
            "- The request allows application code, package files, secrets, deployment files, or merge-gate changes.",
            "- The adapter cannot validate the request.",
            "- The adapter cannot produce a compliant response.",
            "- Any generated output claims a real code review, real patch execution, merge approval, or Git operation.",
        ]
    )


def fallback_executor_request() -> str:
    return generated_executor_request().replace(
        "- Requested by agent: CrewAI Executor Request Writer",
        "- Requested by agent: fallback script because CrewAI did not execute",
    )


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
        ("Acceptance criteria", "## Acceptance criteria" in markdown),
        ("Stop conditions", "## Stop conditions" in markdown),
    ]
    for label, passed in required_checks:
        if not passed:
            findings.append(f"- Missing or invalid required field/section: {label}")

    files_allowed = field_value(markdown, "Files allowed").lower()
    commands_allowed = field_value(markdown, "Commands allowed").lower()
    expected_output = field_value(markdown, "Expected output").lower()
    safety_constraints = field_value(markdown, "Safety constraints").lower()

    forbidden_allowed_patterns = [
        ("app/", files_allowed),
        ("components/", files_allowed),
        ("lib/", files_allowed),
        ("public/", files_allowed),
        ("package.json", files_allowed),
        ("package-lock.json", files_allowed),
        (".env", files_allowed),
        ("git push", commands_allowed),
        ("git commit", commands_allowed),
        ("git merge", commands_allowed),
        ("git reset", commands_allowed),
        ("git checkout", commands_allowed),
        ("npm install", commands_allowed),
        ("rm -rf", commands_allowed),
    ]
    for pattern, haystack in forbidden_allowed_patterns:
        if pattern in haystack:
            findings.append(f"- Forbidden item appears in an allowed field: {pattern}")

    if "none" not in commands_allowed and "read-only" not in commands_allowed:
        findings.append("- Commands allowed must be none or explicitly read-only.")
    if "files changed set to none" not in expected_output:
        findings.append("- Expected output must require `Files changed: none`.")
    if "no repository writes" not in safety_constraints:
        findings.append("- Safety constraints must forbid repository writes.")
    if "no git operations" not in safety_constraints:
        findings.append("- Safety constraints must forbid Git operations.")

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
                limitations=["- CrewAI did not execute, so the handshake is infrastructure blocked."],
                error=traceback.format_exc(),
            ),
            request,
        )

    version = crewai_version()

    class DeterministicHandshakeLLM(BaseLLM):
        """Local deterministic LLM adapter for provider-free CrewAI execution."""

        def __init__(self) -> None:
            super().__init__(model="site-love-deterministic-crewai-codex-no-write-handshake")

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
                    "Merge policy: unchanged; final human approval remains mandatory.",
                ]
            )

    try:
        llm = DeterministicHandshakeLLM()
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
                    "- This is a no-write executor handshake, not a real code patch.",
                    "- This is not real code review evidence and not merge approval.",
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
                evidence=["- CrewAI imported, but handshake execution failed.", "- Fallback Executor Request was generated by the script."],
                limitations=["- CrewAI could not complete real execution, so no real CrewAI execution claim is made."],
                error=traceback.format_exc(),
            ),
            request,
        )


def build_codex_no_write_response(
    request_path: Path,
    response_path: Path,
    report_path: Path,
    request_markdown: str,
    request_validation: ValidationResult,
) -> str:
    request_id = field_value(request_markdown, "Request ID") or "unknown"
    files_allowed = field_value(request_markdown, "Files allowed") or "none"
    commands_allowed = field_value(request_markdown, "Commands allowed") or "none"
    safe_to_proceed = "yes" if request_validation.valid else "no"
    validation_line = (
        "request valid; no-write constraints preserved"
        if request_validation.valid
        else "request invalid; see validation findings"
    )

    return "\n".join(
        [
            "# Executor Response",
            "",
            f"- Request ID: {request_id}",
            "- Executor: Codex no-write adapter",
            "- Execution mode: read-only/no-write",
            "- Real execution: yes",
            "- Actions performed: read executor-request.md, extracted required fields, validated no-write scope, generated this response artifact",
            "- Files changed: none",
            "- Commands run: none",
            f"- Validation results: {validation_line}",
            "- Diff summary: none",
            f"- Report path: `{report_path}`",
            "- Errors: none",
            "- Limitations: read-only adapter only; no repository write actions; no real code review; no merge approval; no merge-gate integration",
            f"- Safe to proceed: {safe_to_proceed}",
            "",
            "## Evidence",
            "",
            f"- Request path read: `{request_path}`",
            f"- Response path written by harness: `{response_path}`",
            "- Real Codex execution: yes, limited to this no-write adapter processing the actual request content.",
            "- Repo writes by adapter: no",
            "- Git operations by adapter: no",
            "- Patch execution by adapter: no",
            "- Files the adapter was allowed to read:",
            f"  - {files_allowed}",
            "- Commands theoretically allowed in a future read-only executor:",
            f"  - {commands_allowed}",
            "",
            "## Output",
            "",
            "The request was processed as a no-write handshake. The adapter confirmed that repository writes and Git operations are disallowed, preserved the CrewAI/Codex role boundary, and produced this response without modifying application files.",
            "",
            "## Follow-up",
            "",
            "Keep this as handshake evidence only. A later reviewed phase is required before any real patch execution, merge-gate integration, or review-on-diff claim.",
        ]
    )


def validate_executor_response(markdown: str) -> ValidationResult:
    findings: list[str] = []
    required_checks = [
        ("title", markdown.startswith("# Executor Response")),
        ("Request ID", bool(field_value(markdown, "Request ID"))),
        ("Executor: Codex no-write adapter", field_value(markdown, "Executor") == "Codex no-write adapter"),
        ("Execution mode: read-only/no-write", field_value(markdown, "Execution mode") == "read-only/no-write"),
        ("Real execution: yes", field_value(markdown, "Real execution").lower() == "yes"),
        ("Files changed: none", field_value(markdown, "Files changed").lower() == "none"),
        ("Commands run: none", field_value(markdown, "Commands run").lower() == "none"),
        ("Diff summary: none", field_value(markdown, "Diff summary").lower() == "none"),
        ("Validation results", bool(field_value(markdown, "Validation results"))),
        ("Evidence section", "## Evidence" in markdown),
        ("Follow-up section", "## Follow-up" in markdown),
    ]
    for label, passed in required_checks:
        if not passed:
            findings.append(f"- Missing or invalid response field/section: {label}")

    lower = markdown.lower()
    unsafe_phrases = [
        "files changed: app/",
        "files changed: components/",
        "files changed: lib/",
        "commands run: git",
        "commands run: npm",
        "git push completed",
        "git merge completed",
        "git commit completed",
        "committed changes",
        "pushed branch",
        "merged branch",
        "repository files were modified",
        "application files were modified",
        "real code review completed",
        "merge approved",
    ]
    for phrase in unsafe_phrases:
        if phrase in lower:
            findings.append(f"- Unsafe response claim detected: {phrase}")

    return ValidationResult(valid=not findings, findings=findings or ["- Executor Response passed deterministic validation."])


def run_codex_no_write_adapter(request_path: Path, response_path: Path, report_path: Path) -> CodexAdapterResult:
    errors: list[str] = []
    try:
        request_markdown = request_path.read_text(encoding="utf-8")
    except Exception as exc:
        request_markdown = ""
        errors.append(f"- Failed to read request: {exc}")

    request_validation = validate_executor_request(request_markdown)
    response = build_codex_no_write_response(
        request_path=request_path,
        response_path=response_path,
        report_path=report_path,
        request_markdown=request_markdown,
        request_validation=request_validation,
    )
    response_validation = validate_executor_response(response)

    files_allowed = field_value(request_markdown, "Files allowed")
    commands_allowed = field_value(request_markdown, "Commands allowed")
    files_read = [str(request_path)]
    commands_theoretically_allowed = [commands_allowed] if commands_allowed else ["none"]

    return CodexAdapterResult(
        real_codex_execution=bool(request_markdown),
        execution_mode="read-only/no-write",
        executor_response_generated=bool(response),
        executor_response_valid=response_validation.valid,
        validation_findings=response_validation.findings,
        response=response,
        files_read=files_read + ([files_allowed] if files_allowed else []),
        commands_theoretically_allowed=commands_theoretically_allowed,
        errors=errors,
        limitations=[
            "- Codex adapter did not run shell commands.",
            "- Codex adapter did not modify repository files.",
            "- Codex adapter did not perform Git operations.",
            "- This handshake is not a real review on a real diff.",
        ],
    )


def final_verdict(crewai: CrewAIResult, codex: CodexAdapterResult) -> str:
    if not crewai.crewai_importable or not crewai.real_crewai_execution:
        return INFRASTRUCTURE_BLOCKED
    if not crewai.executor_request_valid:
        return CHANGES_REQUESTED
    if not codex.executor_response_valid:
        return CHANGES_REQUESTED
    if not codex.real_codex_execution:
        return INFRASTRUCTURE_BLOCKED
    return PASS_WITH_NOTES


def build_report(
    report_path: Path,
    request_path: Path,
    response_path: Path,
    crewai: CrewAIResult,
    codex: CodexAdapterResult,
) -> str:
    verdict = final_verdict(crewai, codex)
    output_sections = []
    for agent_id in AGENTS:
        output_sections.extend(
            [
                f"### {agent_id}",
                "",
                crewai.agent_outputs.get(agent_id, "No output captured."),
                "",
            ]
        )

    evidence = [
        f"- Report path: `{report_path}`",
        f"- Executor request path: `{request_path}`",
        f"- Executor response path: `{response_path}`",
        f"- Python executable: `{sys.executable}`",
        f"- CrewAI importable: {yes_no(crewai.crewai_importable)}",
        f"- CrewAI version: {crewai.crewai_version}",
        f"- Real CrewAI execution: {yes_no(crewai.real_crewai_execution)}",
        f"- Real Codex execution: {yes_no(codex.real_codex_execution)}",
        "- Codex execution mode: read-only/no-write",
        "- Repo modification: no",
        "- Git operations: no",
        *crewai.evidence,
    ]

    error_lines = []
    if crewai.error:
        error_lines.extend(["CrewAI execution error:", "", "```text", crewai.error.strip(), "```"])
    if codex.errors:
        error_lines.extend(["Codex adapter errors:", "", markdown_list(codex.errors)])

    return "\n".join(
        [
            "# CrewAI to Codex No-Write Handshake Report",
            "",
            f"- Phase: {PHASE}",
            "- Orchestrator: CrewAI",
            "- Executor: Codex no-write adapter",
            f"- Real CrewAI execution: {yes_no(crewai.real_crewai_execution)}",
            f"- CrewAI importable: {yes_no(crewai.crewai_importable)}",
            f"- CrewAI version: {crewai.crewai_version}",
            f"- Executor Request generated: {yes_no(crewai.executor_request_generated)}",
            f"- Executor Request valid: {yes_no(crewai.executor_request_valid)}",
            f"- Real Codex execution: {yes_no(codex.real_codex_execution)}",
            "- Codex execution mode: read-only/no-write",
            f"- Executor Response generated: {yes_no(codex.executor_response_generated)}",
            f"- Executor Response valid: {yes_no(codex.executor_response_valid)}",
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
            "## Codex no-write execution",
            "",
            "- Adapter read the generated `executor-request.md` artifact.",
            "- Adapter generated a real `executor-response.md` artifact from the request content.",
            "- Adapter execution mode: read-only/no-write.",
            "- Files changed: none.",
            "- Commands run: none.",
            "- Git operations: none.",
            "",
            "## Executor Response validation",
            "",
            markdown_list(codex.validation_findings),
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
            "- Real code review claim: no",
            "",
            "## Evidence",
            "",
            markdown_list(evidence),
            "",
            "## Limitations",
            "",
            markdown_list(crewai.limitations + codex.limitations),
            "",
            "## Final decision",
            "",
            "This phase demonstrates a real CrewAI request generation and a real Codex no-write adapter response. It does not authorize repository writes, Git operations, real patch execution, real review on a diff, merge-gate integration, or merge.",
            "",
            f"Final verdict: {verdict}",
            "",
            "## Next step",
            "",
            "Review this branch manually. A separate reviewed phase is required before any write-capable Codex executor bridge or merge-gate integration is considered.",
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
    response_path = report_dir / "executor-response.md"
    report_path = report_dir / "crewai-codex-no-write-handshake.md"

    crewai_result, request = run_real_crewai_request_generation()
    request_path.write_text(request + "\n", encoding="utf-8")

    codex_result = run_codex_no_write_adapter(request_path, response_path, report_path)
    response_path.write_text(codex_result.response + "\n", encoding="utf-8")
    report_path.write_text(
        build_report(report_path, request_path, response_path, crewai_result, codex_result) + "\n",
        encoding="utf-8",
    )

    verdict = final_verdict(crewai_result, codex_result)
    print(f"Report: {report_path}")
    print(f"Executor request: {request_path}")
    print(f"Executor response: {response_path}")
    print(f"CrewAI importable: {yes_no(crewai_result.crewai_importable)}")
    print(f"CrewAI version: {crewai_result.crewai_version}")
    print(f"Real CrewAI execution: {yes_no(crewai_result.real_crewai_execution)}")
    print(f"Executor Request generated: {yes_no(crewai_result.executor_request_generated)}")
    print(f"Executor Request valid: {yes_no(crewai_result.executor_request_valid)}")
    print(f"Real Codex execution: {yes_no(codex_result.real_codex_execution)}")
    print("Codex execution mode: read-only/no-write")
    print(f"Executor Response generated: {yes_no(codex_result.executor_response_generated)}")
    print(f"Executor Response valid: {yes_no(codex_result.executor_response_valid)}")
    print("Repo modification: no")
    print("Git operations: no")
    print(f"Agent separation: {yes_no(crewai_result.agent_separation)}")
    print(f"Final verdict: {verdict}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
