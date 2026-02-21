#!/usr/bin/env python3
"""Embed rule policy summaries directly into generated skill files."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path


@dataclass
class PolicyMeta:
    language: str
    bucket: str
    role: str
    policies: list[str]


ROLE_CONVENTIONS = {
    "governance": [
        "Follow TDD in strict order (RED -> GREEN -> REFACTOR) for every task.",
        "Prove completion/success claims with verification command output in the same turn.",
        "Block layer-boundary violations immediately.",
    ],
    "foundation": [
        "Apply the language baseline architecture first, then layer-specific rules.",
        "Keep types and contracts explicit.",
        "Prioritize shared quality standards (TDD, evidence-based reporting).",
    ],
    "controller": [
        "Controllers/views handle only HTTP boundary concerns.",
        "Delegate business logic to the service layer.",
        "Manage I/O contracts with DTOs/serializers.",
    ],
    "service": [
        "The service layer owns business rules and use-case orchestration.",
        "Manage transaction boundaries explicitly in services.",
        "Prove service behavior with failing tests first.",
    ],
    "repository": [
        "Keep repositories focused on queries and persistence details.",
        "Provide clear data-access contracts for service-layer usage.",
        "Do not place business branching logic in repositories.",
    ],
    "domain-model": [
        "Keep models/entities focused on domain state and invariants.",
        "Keep orchestration logic in the service layer.",
        "Do not expose internal model details across boundaries.",
    ],
    "io-validation": [
        "Perform I/O validation at boundaries; validate domain rules in services.",
        "Keep schemas/DTOs/serializers focused on contract expression.",
        "Do not place business orchestration in validation layers.",
    ],
    "security": [
        "Enforce authentication/authorization policies consistently.",
        "Include regression verification for security-sensitive changes.",
        "Do not leave temporary exception rules in permanent code.",
    ],
    "testing": [
        "Prioritize service tests, then expand to upper-layer tests.",
        "Preserve the cycle: reproduce failure -> fix -> add regression test.",
        "Avoid tests that over-couple to implementation details.",
    ],
    "platform": [
        "Keep config/middleware/bootstrap focused on shared infrastructure concerns.",
        "Do not place feature business logic in platform layers.",
        "Document environment-specific behavior differences explicitly.",
    ],
    "async": [
        "Keep async state tracking and failure recovery paths explicit.",
        "Include retry and idempotency in design.",
        "Separate request-response paths from long-running jobs.",
    ],
    "capability": [
        "Keep domain feature scope explicit and bounded.",
        "Apply feature policy without conflicting with baseline/layer skills.",
        "Keep feature-level regression checkpoints explicit.",
    ],
}

ROLE_PROHIBITED = {
    "governance": [
        "Do not claim completion without verification.",
        "Do not allow layer violations as \"exceptions\".",
    ],
    "controller": [
        "Do not access repositories/models directly from controllers/views.",
        "Do not place business branching/transaction logic in controllers.",
    ],
    "service": [
        "Do not place HTTP request/response formatting in services.",
        "Do not merge business changes without tests.",
    ],
    "repository": [
        "Do not place use-case decisions in repositories.",
    ],
    "foundation": [
        "Do not add temporary patterns that bypass baseline language rules.",
    ],
    "capability": [
        "Do not add excessive abstractions unrelated to feature requirements.",
    ],
}


def parse_source_rules(path: Path) -> PolicyMeta:
    lines = path.read_text(encoding="utf-8").splitlines()

    language = ""
    bucket = ""
    role = ""
    policies: list[str] = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("- Language:"):
            language = stripped.split("`")[1]
        elif stripped.startswith("- Bucket:"):
            bucket = stripped.split("`")[1]
        elif stripped.startswith("- Role:"):
            role = stripped.split("`")[1]
        elif stripped.startswith("| `"):
            cols = [col.strip() for col in stripped.strip("|").split("|")]
            if len(cols) >= 4:
                policy = cols[3].strip()
                if policy and policy != "-":
                    policies.append(policy)

    if not language or not bucket or not role:
        raise ValueError(f"Invalid source-rules format: {path}")

    return PolicyMeta(language=language, bucket=bucket, role=role, policies=policies)


def overview_text(meta: PolicyMeta) -> str:
    if meta.language == "general":
        return "Apply repository-wide engineering governance."
    if meta.bucket == "foundation":
        return f"Apply the {meta.language.capitalize()} baseline first, then layer-specific rules."
    if meta.bucket == "role":
        return f"Enforce `{meta.role}` responsibility boundaries in {meta.language.capitalize()}."
    return f"Apply {meta.language.capitalize()} domain capability rules consistently."


def dependency_lines(skill_name: str, meta: PolicyMeta) -> list[str]:
    if skill_name == "rules-governance":
        return ["- None"]

    lines = ["- `rules-governance`"]
    if meta.bucket != "foundation" and meta.language != "general":
        lines.append(f"- `{meta.language}-foundation-rules`")
    return lines


def titleize(name: str) -> str:
    return " ".join(part.capitalize() for part in name.split("-"))


def frontmatter_description(skill_name: str, meta: PolicyMeta) -> str:
    if skill_name == "rules-governance":
        return (
            "Repository-wide engineering governance. Use first for any task to enforce TDD-first flow, "
            "evidence-based completion reporting, and strict layer boundaries."
        )
    if meta.bucket == "foundation":
        return (
            f"{meta.language.capitalize()} baseline engineering policy. Use before role-specific work to "
            "enforce architecture, typing/contracts, and verification discipline."
        )
    if meta.bucket == "role":
        return (
            f"{meta.language.capitalize()} {meta.role} operating policy. Use when implementing or reviewing "
            f"{meta.role} layer responsibilities with strict boundary and test discipline."
        )
    return (
        f"{meta.language.capitalize()} domain capability policy. Use for feature/domain implementation that "
        "must comply with baseline architecture and evidence-based verification."
    )


def build_skill_markdown(skill_name: str, meta: PolicyMeta) -> str:
    conventions = ROLE_CONVENTIONS.get(meta.role, ROLE_CONVENTIONS["capability"])
    prohibited = ROLE_PROHIBITED.get(meta.role, ROLE_PROHIBITED.get("capability", []))
    dependency = dependency_lines(skill_name, meta)

    policy_lines = [f"- {policy}" for policy in meta.policies]
    convention_lines = [f"- {line}" for line in conventions]
    prohibited_lines = [f"- {line}" for line in prohibited] if prohibited else ["- None"]

    return (
        f"---\n"
        f"name: {skill_name}\n"
        f"description: {frontmatter_description(skill_name, meta)}\n"
        f"---\n\n"
        f"# {titleize(skill_name)}\n\n"
        "## Overview\n\n"
        f"{overview_text(meta)}\n\n"
        "## Dependency Order\n\n"
        + "\n".join(dependency)
        + "\n\n"
        + "## Team Conventions\n\n"
        + "\n".join(convention_lines)
        + "\n\n"
        + "## Mandatory Workflow\n\n"
        + "1. Define the behavior change and verification commands first.\n"
        + "2. Write a failing test first (RED).\n"
        + "3. Implement the minimum change to reach GREEN.\n"
        + "4. Refactor, then run full verification.\n"
        + "5. Report results with command-output evidence.\n\n"
        + "## Prohibited\n\n"
        + "\n".join(prohibited_lines)
        + "\n\n"
        + "## Embedded Policy Pack\n\n"
        + ("\n".join(policy_lines) if policy_lines else "- No policy items.")
        + "\n"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Embed source rule summaries into SKILL.md files."
    )
    parser.add_argument(
        "--skills-dir",
        default=".agents/skills",
        help="Path to skills directory.",
    )
    parser.add_argument(
        "--cleanup-references",
        action="store_true",
        help="Delete references/source-rules.md after embedding.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    skills_dir = Path(args.skills_dir).resolve()

    updated = 0
    removed = 0

    for skill_dir in sorted(skills_dir.iterdir()):
        if not skill_dir.is_dir():
            continue
        source_file = skill_dir / "references" / "source-rules.md"
        if not source_file.exists():
            continue

        meta = parse_source_rules(source_file)
        skill_file = skill_dir / "SKILL.md"
        skill_file.write_text(
            build_skill_markdown(skill_dir.name, meta),
            encoding="utf-8",
        )
        updated += 1

        if args.cleanup_references:
            source_file.unlink(missing_ok=True)
            refs_dir = skill_dir / "references"
            if refs_dir.exists() and not any(refs_dir.iterdir()):
                refs_dir.rmdir()
            removed += 1

    print(f"Updated skills: {updated}")
    if args.cleanup_references:
        print(f"Removed source references: {removed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
