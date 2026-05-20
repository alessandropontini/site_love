#!/usr/bin/env python3
"""Generate a safe CrewAI orchestration dry-run report.

This script does not modify application code, run Git operations, or connect
CrewAI to the merge gate. It only writes an evaluation report under
.agent/reports/<timestamp>/.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import importlib.metadata
import sys
import traceback


CANONICAL_BLOCKED = "INFRASTRUCTURE BLOCKED"
SCENARIO = (
    "Valutare una futura modifica accessibile al pulsante finale Replay nel "
    "componente finale, senza modificare il repository."
)


AGENT_OUTPUTS = {
    "planner": "Defined a non-destructive evaluation sequence for the Replay button scenario.",
    "implementer_simulator": "Produced a plan-only implementation outline; no files were edited.",
    "frontend_architect_reviewer": "Identified review concerns around component boundaries and state impact.",
    "ux_a11y_reviewer": "Identified review concerns around label clarity, focus behavior, and keyboard access.",
    "qa_regression_reviewer": "Identified regression checks for replay flow, ending state, and mobile interaction.",
    "git_workflow_reviewer": "Confirmed this spike must not change branch, merge, approval, or review gates.",
    "aggregator": "Aggregated simulated lane outputs and preserved a blocked verdict because real CrewAI agents did not execute.",
}


TASK_SEQUENCE = [
    "plan_dry_run",
    "simulate_implementation",
    "frontend_architecture_review",
    "ux_accessibility_review",
    "qa_regression_review",
    "git_workflow_review",
    "aggregate_verdict",
]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def crewai_import_status() -> tuple[bool, str, str]:
    try:
        import crewai  # noqa: F401

        try:
            version = importlib.metadata.version("crewai")
        except importlib.metadata.PackageNotFoundError:
            version = "unknown"
        return True, version, ""
    except Exception:
        return False, "not importable", traceback.format_exc()


def build_report(
    report_path: Path,
    timestamp: str,
    crewai_importable: bool,
    crewai_version: str,
    import_error: str,
) -> str:
    real_crewai_execution = False
    agent_separation = "yes"
    final_verdict = CANONICAL_BLOCKED

    evidence_lines = [
        f"- Report path: `{report_path}`",
        f"- Python executable: `{sys.executable}`",
        f"- CrewAI importable: {'yes' if crewai_importable else 'no'}",
        f"- CrewAI version: {crewai_version}",
        "- Real CrewAI execution: no",
        "- Real repo modification: no",
        "- Git operations executed: no",
        "- Application files modified: no",
    ]

    limitation_lines = [
        "- This script validates the adapter report contract only.",
        "- It imports CrewAI when available but does not instantiate or run real CrewAI agents.",
        "- Simulated agent outputs are not real review evidence.",
        "- The result is intentionally `INFRASTRUCTURE BLOCKED` until real CrewAI dry-run execution is implemented.",
    ]

    if import_error:
        limitation_lines.append("- CrewAI import failed; import traceback is captured below.")

    agent_output_lines = []
    for agent_name, output in AGENT_OUTPUTS.items():
        agent_output_lines.append(f"### {agent_name}")
        agent_output_lines.append("")
        agent_output_lines.append(output)
        agent_output_lines.append("")

    task_lines = [f"- {task_id}" for task_id in TASK_SEQUENCE]

    import_error_block = ""
    if import_error:
        import_error_block = "\nImport error:\n\n```text\n" + import_error.strip() + "\n```\n"

    return "\n".join(
        [
            "# CrewAI Orchestrator Evaluation Report",
            "",
            "- Orchestrator: CrewAI",
            "- Mode: dry-run",
            "- Real repo modification: no",
            f"- Agent separation: {agent_separation}",
            "- Executor used for repo writes: none",
            f"- CrewAI importable: {'yes' if crewai_importable else 'no'}",
            f"- CrewAI version: {crewai_version}",
            f"- Real CrewAI execution: {'yes' if real_crewai_execution else 'no'}",
            f"- Final verdict: {final_verdict}",
            "",
            "## Scenario",
            "",
            SCENARIO,
            "",
            "## Agents",
            "",
            "- planner: Orchestration Planner",
            "- implementer_simulator: Implementer Simulator",
            "- frontend_architect_reviewer: Frontend Architect Reviewer",
            "- ux_a11y_reviewer: UX Accessibility Reviewer",
            "- qa_regression_reviewer: QA Regression Reviewer",
            "- git_workflow_reviewer: Git Workflow Reviewer",
            "- aggregator: Review Aggregator",
            "",
            "## Task sequence",
            "",
            "\n".join(task_lines),
            "",
            "## Agent outputs",
            "",
            "\n".join(agent_output_lines).rstrip(),
            "",
            "## Evidence",
            "",
            "\n".join(evidence_lines),
            import_error_block.rstrip(),
            "",
            "## Limitations",
            "",
            "\n".join(limitation_lines),
            "",
            "## Final decision",
            "",
            "CrewAI remains a pluggable orchestrator candidate. This dry-run does not create real review evidence and does not change the merge gate.",
            "",
            f"Final verdict: {final_verdict}",
            "",
            "## Next step",
            "",
            "Implement a real CrewAI dry-run only if it can produce separate agent outputs, preserve Codex as executor, avoid repository modifications, and keep final human approval mandatory.",
            "",
        ]
    )


def main() -> int:
    root = repo_root()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    report_dir = root / ".agent" / "reports" / timestamp
    report_dir.mkdir(parents=True, exist_ok=True)
    report_path = report_dir / "crewai-orchestrator-evaluation.md"

    crewai_importable, crewai_version, import_error = crewai_import_status()
    report = build_report(
        report_path=report_path,
        timestamp=timestamp,
        crewai_importable=crewai_importable,
        crewai_version=crewai_version,
        import_error=import_error,
    )
    report_path.write_text(report, encoding="utf-8")

    print(f"Report: {report_path}")
    print(f"CrewAI importable: {'yes' if crewai_importable else 'no'}")
    print("Real CrewAI execution: no")
    print(f"Final verdict: {CANONICAL_BLOCKED}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
