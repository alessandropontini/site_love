#!/usr/bin/env python3
"""Safe CrewAI scaffold for SITE LOVE.

CrewAI is prepared here as a future orchestrator only. Codex remains the
operational executor for repository inspection, patching, validation, and real
review. Reviewers are read-only, real review still flows through
scripts/local-review.sh, and final human approval is mandatory before merge.
"""

from __future__ import annotations

import argparse
import importlib.util
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    ".agent/prompts/review-code.md",
    ".agent/prompts/review-qa-regression.md",
    ".agent/reports/.gitkeep",
    "scripts/local-review.sh",
    "scripts/test-multiagent-workflow.sh",
    "orchestration/agents.yaml",
    "orchestration/tasks.yaml",
]

LANES = {
    "implementation": [
        "patch_planner",
        "patch_implementer",
        "validation_runner",
    ],
    "review": [
        "frontend_architect_reviewer",
        "code_reviewer",
        "ux_accessibility_reviewer",
        "performance_reviewer",
        "qa_regression_reviewer",
        "git_workflow_reviewer",
    ],
    "aggregation": [
        "review_aggregator",
    ],
}


def run_git(args: list[str], *, preserve_status_spacing: bool = False) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        return result.stderr.strip()
    if preserve_status_spacing:
        return result.stdout.rstrip()
    return result.stdout.strip()


def current_branch() -> str:
    branch = run_git(["branch", "--show-current"])
    return branch or "(detached HEAD)"


def git_status_short() -> str:
    return run_git(["status", "--short", "--untracked-files=all"], preserve_status_spacing=True)


def crewai_installed() -> bool:
    return importlib.util.find_spec("crewai") is not None


def refuse_prod() -> None:
    branch = current_branch()
    if branch == "prod":
        raise SystemExit("ERROR: refusing to run CrewAI scaffold on protected branch 'prod'.")


def print_repo_state() -> None:
    status = git_status_short()
    print(f"Branch: {current_branch()}")
    print("Git status:")
    print(status if status else "  clean")


def validate_required_files() -> int:
    missing = []
    for rel_path in REQUIRED_FILES:
        path = REPO_ROOT / rel_path
        if not path.exists():
            missing.append(rel_path)

    print("Required files:")
    for rel_path in REQUIRED_FILES:
        marker = "ok" if (REPO_ROOT / rel_path).exists() else "missing"
        print(f"- {rel_path}: {marker}")

    return 1 if missing else 0


def print_lanes() -> None:
    print("CrewAI lanes:")
    for lane, agents in LANES.items():
        print(f"- {lane}:")
        for agent in agents:
            print(f"  - {agent}")


def print_config_preview() -> None:
    print("Configuration:")
    for rel_path in ["orchestration/agents.yaml", "orchestration/tasks.yaml"]:
        path = REPO_ROOT / rel_path
        print(f"- {rel_path}: {'present' if path.exists() else 'missing'}")


def print_crewai_status() -> None:
    if crewai_installed():
        print("CrewAI package: installed")
    else:
        print("CrewAI package: not installed")
        print("This is acceptable for scaffold smoke checks; CrewAI is not executing site work yet.")


def command_status(_args: argparse.Namespace) -> int:
    refuse_prod()
    print_repo_state()
    print_crewai_status()
    print_config_preview()
    file_status = validate_required_files()
    print_lanes()
    print("Safety: no commit, merge, push, or site work is performed by this scaffold.")
    return file_status


def command_smoke(_args: argparse.Namespace) -> int:
    refuse_prod()
    print_repo_state()
    print_crewai_status()
    file_status = validate_required_files()
    print_lanes()
    print("Smoke result: non-destructive scaffold checks completed.")
    return file_status


def command_explain(_args: argparse.Namespace) -> int:
    refuse_prod()
    print(
        "SITE LOVE CrewAI scaffold prepares future orchestration only. "
        "CrewAI coordinates lanes and role intent; Codex performs real repository work."
    )
    print()
    print_lanes()
    print()
    print("Rules:")
    print("- Implementation lane may plan, implement authorized patches, and run validation, but cannot approve.")
    print("- Review lane is READ ONLY and cannot modify files.")
    print("- Aggregation lane derives verdicts from reviewer reports and cannot invent evidence.")
    print("- Real review remains scripts/local-review.sh with Codex provider reports.")
    print("- Human approval is mandatory before merge.")
    print("- This scaffold never commits, merges, pushes, or runs site-changing tasks.")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Safe CrewAI scaffold for SITE LOVE orchestration."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("status", help="Show repository and scaffold status.")
    subparsers.add_parser("smoke", help="Run non-destructive scaffold checks.")
    subparsers.add_parser("explain", help="Explain lanes, roles, and safety rules.")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "status":
        return command_status(args)
    if args.command == "smoke":
        return command_smoke(args)
    if args.command == "explain":
        return command_explain(args)

    parser.error(f"unsupported command: {args.command}")
    return 2


if __name__ == "__main__":
    sys.exit(main())
