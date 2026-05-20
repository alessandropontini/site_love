#!/usr/bin/env python3
"""Run a safe CrewAI orchestration dry-run and write an evidence report.

This script does not modify application code, run Git operations, commit, push,
or connect CrewAI to the merge gate. It only writes an evaluation report under
.agent/reports/<timestamp>/.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import importlib.metadata
import os
import sys
import traceback


CANONICAL_PASS_WITH_NOTES = "PASS WITH NOTES"
CANONICAL_CHANGES_REQUESTED = "CHANGES REQUESTED"
CANONICAL_BLOCKED = "INFRASTRUCTURE BLOCKED"
SCENARIO = (
    "Valutare una futura modifica accessibile al pulsante finale Replay nel "
    "componente finale, senza modificare il repository."
)

AGENTS = {
    "planner": {
        "role": "Orchestration Planner",
        "goal": "Define task sequence without modifying repo",
        "backstory": "You coordinate safe dry-run evaluation tasks and never request repository writes.",
    },
    "implementer_simulator": {
        "role": "Implementer Simulator",
        "goal": "Produce an implementation plan but do not edit files",
        "backstory": "You describe a possible implementation plan while preserving a no-write policy.",
    },
    "frontend_architect_reviewer": {
        "role": "Frontend Architect Reviewer",
        "goal": "Review architectural impact independently",
        "backstory": "You assess frontend architecture impact without implementing changes.",
    },
    "ux_a11y_reviewer": {
        "role": "UX Accessibility Reviewer",
        "goal": "Review accessibility and user experience independently",
        "backstory": "You assess accessibility, labels, focus, and keyboard behavior independently.",
    },
    "qa_regression_reviewer": {
        "role": "QA Regression Reviewer",
        "goal": "Review test and regression risk independently",
        "backstory": "You assess regression and validation coverage without running destructive tools.",
    },
    "git_workflow_reviewer": {
        "role": "Git Workflow Reviewer",
        "goal": "Review branch, merge and approval policy independently",
        "backstory": "You verify branch flow, merge policy, and evidence rules without running Git.",
    },
    "aggregator": {
        "role": "Review Aggregator",
        "goal": "Aggregate outputs and produce canonical final verdict",
        "backstory": "You aggregate dry-run evidence and never approve merge or hide limitations.",
    },
}

TASKS = [
    {
        "id": "plan_dry_run",
        "agent": "planner",
        "description": (
            "Define a safe CrewAI dry-run sequence for the Replay button accessibility "
            "scenario. Do not modify repository files."
        ),
        "expected_output": "A concise task sequence and safety boundary summary.",
    },
    {
        "id": "simulate_implementation",
        "agent": "implementer_simulator",
        "description": (
            "Produce a plan-only implementation outline for making the final Replay "
            "button more accessible. Do not edit files."
        ),
        "expected_output": "A non-destructive implementation plan with no repository writes.",
    },
    {
        "id": "frontend_architecture_review",
        "agent": "frontend_architect_reviewer",
        "description": "Review possible frontend architecture impact independently.",
        "expected_output": "Architecture review notes and any concerns.",
    },
    {
        "id": "ux_accessibility_review",
        "agent": "ux_a11y_reviewer",
        "description": "Review accessibility and user experience implications independently.",
        "expected_output": "UX and accessibility review notes and any concerns.",
    },
    {
        "id": "qa_regression_review",
        "agent": "qa_regression_reviewer",
        "description": "Review test and regression risk independently.",
        "expected_output": "QA and regression review notes and validation suggestions.",
    },
    {
        "id": "git_workflow_review",
        "agent": "git_workflow_reviewer",
        "description": "Review branch, merge, approval, and evidence policy independently.",
        "expected_output": "Git workflow review notes and policy risks.",
    },
    {
        "id": "aggregate_verdict",
        "agent": "aggregator",
        "description": (
            "Aggregate the dry-run outputs into one canonical verdict. Preserve final "
            "human approval and do not approve merge."
        ),
        "expected_output": "A canonical verdict and next-step recommendation.",
    },
]


@dataclass
class CrewRunResult:
    crewai_importable: bool
    crewai_version: str
    real_crewai_execution: bool
    agent_separation: bool
    final_verdict: str
    agent_outputs: dict[str, str]
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


def run_real_crewai_dry_run() -> CrewRunResult:
    os.environ.setdefault("CREWAI_TRACING_ENABLED", "false")
    os.environ.setdefault("OTEL_SDK_DISABLED", "true")

    try:
        from crewai import Agent, Crew, Process, Task
        from crewai.llms.base_llm import BaseLLM
    except Exception:
        return CrewRunResult(
            crewai_importable=False,
            crewai_version="not importable",
            real_crewai_execution=False,
            agent_separation=False,
            final_verdict=CANONICAL_BLOCKED,
            agent_outputs={},
            evidence=["- CrewAI import failed."],
            limitations=["- CrewAI could not be imported, so no real CrewAI dry-run was possible."],
            error=traceback.format_exc(),
        )

    version = crewai_version()

    class DeterministicDryRunLLM(BaseLLM):
        """Local deterministic LLM adapter for a no-provider CrewAI dry-run."""

        def __init__(self) -> None:
            super().__init__(model="site-love-deterministic-crewai-dry-run")

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
            task_description = getattr(from_task, "description", "No task description provided.")
            expected_output = getattr(from_task, "expected_output", "No expected output provided.")
            return "\n".join(
                [
                    f"Agent role: {role}",
                    f"Scenario: {SCENARIO}",
                    f"Task handled: {task_description}",
                    f"Expected output: {expected_output}",
                    "Repository writes: none",
                    "Git operations: none",
                    "Dry-run finding: CrewAI executed this role as a separate task lane using a local deterministic LLM.",
                    "Merge policy: no merge authorization; final human approval remains mandatory.",
                ]
            )

    try:
        llm = DeterministicDryRunLLM()
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

        complete_outputs = all(agent_outputs.get(agent_id) for agent_id in AGENTS)
        agent_separation = len(agent_outputs) == len(AGENTS) and set(agent_outputs) == set(AGENTS)
        final_verdict = (
            CANONICAL_PASS_WITH_NOTES
            if complete_outputs and agent_separation
            else CANONICAL_CHANGES_REQUESTED
        )
        limitations = [
            "- CrewAI executed a real local dry-run, but with a deterministic in-process LLM rather than an external model provider.",
            "- The output is orchestration evidence, not real code review evidence.",
            "- CrewAI is not integrated with Codex executor, `scripts/local-review.sh`, CI, or the merge gate.",
            "- Final human approval remains mandatory before any merge toward `prod`.",
        ]
        return CrewRunResult(
            crewai_importable=True,
            crewai_version=version,
            real_crewai_execution=True,
            agent_separation=agent_separation,
            final_verdict=final_verdict,
            agent_outputs=agent_outputs,
            evidence=[
                "- CrewAI `Agent`, `Task`, and `Crew` objects were instantiated.",
                "- CrewAI `Crew.kickoff()` completed.",
                "- Seven task outputs were collected from separate CrewAI task lanes.",
                "- No CrewAI tools were configured.",
                "- No repository write executor was exposed to CrewAI.",
            ],
            limitations=limitations,
        )
    except Exception:
        return CrewRunResult(
            crewai_importable=True,
            crewai_version=version,
            real_crewai_execution=False,
            agent_separation=False,
            final_verdict=CANONICAL_BLOCKED,
            agent_outputs={},
            evidence=["- CrewAI imported, but dry-run execution failed."],
            limitations=["- CrewAI could not complete a real dry-run, so no execution claim is made."],
            error=traceback.format_exc(),
        )


def markdown_list(lines: list[str]) -> str:
    return "\n".join(lines) if lines else "- None recorded."


def build_report(report_path: Path, result: CrewRunResult) -> str:
    task_lines = [f"- {task_config['id']}: `{task_config['agent']}`" for task_config in TASKS]
    agent_lines = [
        f"- {agent_id}: {config['role']} - {config['goal']}" for agent_id, config in AGENTS.items()
    ]
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
        f"- Python executable: `{sys.executable}`",
        f"- CrewAI importable: {'yes' if result.crewai_importable else 'no'}",
        f"- CrewAI version: {result.crewai_version}",
        f"- Real CrewAI execution: {'yes' if result.real_crewai_execution else 'no'}",
        "- Real repo modification: no",
        "- Git operations executed: no",
        "- Application files modified: no",
        "- Executor used for repo writes: none",
        *result.evidence,
    ]

    error_block = ""
    if result.error:
        error_block = "\nExecution error:\n\n```text\n" + result.error.strip() + "\n```\n"

    return "\n".join(
        [
            "# CrewAI Orchestrator Evaluation Report",
            "",
            "- Orchestrator: CrewAI",
            "- Mode: dry-run",
            "- Real repo modification: no",
            f"- Agent separation: {'yes' if result.agent_separation else 'no'}",
            "- Executor used for repo writes: none",
            f"- CrewAI importable: {'yes' if result.crewai_importable else 'no'}",
            f"- CrewAI version: {result.crewai_version}",
            f"- Real CrewAI execution: {'yes' if result.real_crewai_execution else 'no'}",
            f"- Final verdict: {result.final_verdict}",
            "",
            "## Scenario",
            "",
            SCENARIO,
            "",
            "## Agents",
            "",
            "\n".join(agent_lines),
            "",
            "## Task sequence",
            "",
            "\n".join(task_lines),
            "",
            "## Agent outputs",
            "",
            "\n".join(output_sections).rstrip(),
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
            "CrewAI remains a pluggable orchestrator candidate. This dry-run does not create merge approval and does not change the merge gate.",
            "",
            f"Final verdict: {result.final_verdict}",
            "",
            "## Next step",
            "",
            "Review this branch manually. If accepted, keep CrewAI isolated as an orchestrator adapter and evaluate a future Codex-executor bridge separately.",
            "",
        ]
    )


def main() -> int:
    root = repo_root()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    report_dir = root / ".agent" / "reports" / timestamp
    report_dir.mkdir(parents=True, exist_ok=True)
    report_path = report_dir / "crewai-orchestrator-evaluation.md"

    result = run_real_crewai_dry_run()
    report_path.write_text(build_report(report_path, result), encoding="utf-8")

    print(f"Report: {report_path}")
    print(f"CrewAI importable: {'yes' if result.crewai_importable else 'no'}")
    print(f"CrewAI version: {result.crewai_version}")
    print(f"Real CrewAI execution: {'yes' if result.real_crewai_execution else 'no'}")
    print(f"Agent separation: {'yes' if result.agent_separation else 'no'}")
    print(f"Final verdict: {result.final_verdict}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
