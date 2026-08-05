#!/usr/bin/env python3
"""Non-destructive status checks for the archived SITE LOVE CrewAI experiment."""

from __future__ import annotations

import argparse
import importlib.util
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    ".agent/prompts/review-code-qa.md",
    ".agent/reports/.gitkeep",
    "scripts/local-review.sh",
    "scripts/test-multiagent-workflow.sh",
    "orchestration/agents.yaml",
    "orchestration/tasks.yaml",
]

FLOW = [
    "interactive Codex implementation",
    "required shell validation",
    "one fresh read-only Codex Code + QA review",
    "deterministic verdict aggregation",
    "human approval",
]


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


def print_flow() -> None:
    print("Current release flow (CrewAI inactive):")
    for step in FLOW:
        print(f"- {step}")


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
        print("This is expected; CrewAI is not part of the release path.")


def command_status(_args: argparse.Namespace) -> int:
    refuse_prod()
    print_repo_state()
    print_crewai_status()
    print_config_preview()
    file_status = validate_required_files()
    print_flow()
    print("Safety: this archived scaffold does not implement, review, commit, merge, or push.")
    return file_status


def command_smoke(_args: argparse.Namespace) -> int:
    refuse_prod()
    print_repo_state()
    print_crewai_status()
    file_status = validate_required_files()
    print_flow()
    print("Smoke result: archived scaffold files are internally consistent.")
    return file_status


def command_explain(_args: argparse.Namespace) -> int:
    refuse_prod()
    print(
        "CrewAI is an archived SITE LOVE experiment. The release path uses Codex directly."
    )
    print()
    print_flow()
    print()
    print("Rules:")
    print("- The interactive implementation response cannot approve its own work.")
    print("- Real review is one fresh read-only Codex execution through scripts/local-review.sh.")
    print("- The deterministic shell aggregator cannot invent or repair evidence.")
    print("- Human approval is mandatory before merge.")
    print("- CrewAI is not invoked by this flow and this scaffold never changes the site.")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Archived CrewAI scaffold status for SITE LOVE."
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
