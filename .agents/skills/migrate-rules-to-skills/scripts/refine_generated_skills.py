#!/usr/bin/env python3
"""Refine scaffolded migration skills into production-ready skill folders."""

from __future__ import annotations

import argparse
import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass
class SourceRule:
    path: str
    globs: str
    always_apply: str
    description: str


@dataclass
class SkillMeta:
    language: str
    bucket: str
    role: str
    rules: list[SourceRule]


ROLE_CHECKLIST = {
    "governance": [
        "Load and apply repository-wide baseline constraints first.",
        "Keep rule-authoring structure consistent with existing conventions.",
        "Reject patterns that violate layered architecture or test discipline.",
    ],
    "foundation": [
        "Enforce language-level architecture and coding conventions.",
        "Define allowed abstractions before touching layer-specific details.",
        "Keep examples short and focused on baseline patterns.",
    ],
    "controller": [
        "Keep HTTP boundary logic in controller/view layer only.",
        "Delegate business logic to service layer.",
        "Use DTO/serializer contracts for request and response models.",
    ],
    "service": [
        "Orchestrate business flows in service layer.",
        "Keep transaction boundaries explicit and testable.",
        "Call repositories and validators; avoid HTTP concerns.",
    ],
    "repository": [
        "Encapsulate persistence details and query logic.",
        "Expose clear data access methods for service layer.",
        "Avoid business branching in repository layer.",
    ],
    "domain-model": [
        "Keep entity/model focused on domain state and invariants.",
        "Avoid direct persistence orchestration in model layer.",
        "Use service layer for lifecycle and orchestration rules.",
    ],
    "io-validation": [
        "Use DTO/serializer/form objects for IO contracts.",
        "Apply structural validation at boundary, domain validation in services.",
        "Keep schemas explicit and free of business orchestration.",
    ],
    "security": [
        "Apply authentication and authorization rules consistently.",
        "Keep security checks close to boundary and service decisions.",
        "Add or update tests for security-sensitive flows.",
    ],
    "testing": [
        "Follow Red-Green-Refactor with layer-oriented test strategy.",
        "Test business rules at service level before API/integration edges.",
        "Avoid brittle tests tied to implementation details.",
    ],
    "platform": [
        "Manage configuration, middleware, and cross-cutting concerns centrally.",
        "Keep feature logic out of platform/bootstrap files.",
        "Document environment-sensitive behavior explicitly.",
    ],
    "async": [
        "Isolate async orchestration from synchronous request handling.",
        "Track task status and failure paths explicitly.",
        "Design idempotent task execution and retry behavior.",
    ],
    "capability": [
        "Keep capability scope narrow and domain-specific.",
        "Integrate with foundation and layer rules without duplication.",
        "Define capability-specific acceptance and regression checks.",
    ],
}


def parse_source_rules(reference_file: Path) -> SkillMeta:
    content = reference_file.read_text(encoding="utf-8").splitlines()

    language = ""
    bucket = ""
    role = ""
    rules: list[SourceRule] = []

    for line in content:
        stripped = line.strip()
        if stripped.startswith("- Language:"):
            language = stripped.split("`")[1]
        elif stripped.startswith("- Bucket:"):
            bucket = stripped.split("`")[1]
        elif stripped.startswith("- Role:"):
            role = stripped.split("`")[1]

    for line in content:
        stripped = line.strip()
        if not stripped.startswith("| `"):
            continue
        parts = [part.strip() for part in stripped.strip("|").split("|")]
        if len(parts) < 4:
            continue
        rules.append(
            SourceRule(
                path=parts[0].strip("`"),
                globs=parts[1].strip("`"),
                always_apply=parts[2],
                description=parts[3],
            )
        )

    if not language or not bucket or not role:
        raise ValueError(f"Invalid source mapping in {reference_file}")

    return SkillMeta(language=language, bucket=bucket, role=role, rules=rules)


def titleize(name: str) -> str:
    return " ".join(part.capitalize() for part in name.split("-"))


def description_for(name: str, meta: SkillMeta) -> str:
    if meta.language == "general":
        return (
            "Repository governance and rule-authoring standards migrated from `.agents/rules/general`. "
            "Use when defining or reviewing cross-language constraints and shared engineering policy."
        )

    if meta.bucket == "foundation":
        return (
            f"{meta.language.capitalize()} architecture baseline migrated from `.agents/rules/{meta.language}`. "
            f"Use when establishing language-wide conventions before role-specific implementation."
        )

    if meta.bucket == "role":
        return (
            f"{meta.language.capitalize()} {meta.role} layer guidance migrated from `.agents/rules/{meta.language}`. "
            f"Use when implementing or reviewing {meta.role} responsibilities."
        )

    return (
        f"{meta.language.capitalize()} domain capability guidance migrated from `.agents/rules/{meta.language}`. "
        "Use for capability-focused implementation that must align with foundation and layer rules."
    )


def dependencies_for(name: str, meta: SkillMeta) -> list[str]:
    if meta.language == "general":
        return []

    deps = ["rules-governance"]
    if meta.bucket != "foundation":
        deps.append(f"{meta.language}-foundation-rules")
    return deps


def build_skill_markdown(name: str, meta: SkillMeta) -> str:
    desc = description_for(name, meta)
    title = titleize(name)
    deps = dependencies_for(name, meta)

    dep_lines = "\n".join(f"- `{dep}`" for dep in deps) if deps else "- None"

    checklist = ROLE_CHECKLIST.get(meta.role, ROLE_CHECKLIST["capability"])
    checklist_lines = "\n".join(f"- {item}" for item in checklist)

    source_lines = "\n".join(
        f"- `{rule.path}` ({rule.globs})" for rule in meta.rules
    )

    return (
        f"---\n"
        f"name: {name}\n"
        f"description: {desc}\n"
        f"---\n\n"
        f"# {title}\n\n"
        "## Overview\n\n"
        f"Apply this skill for `{meta.language}` `{meta.role}` rule enforcement migrated from `.agents/rules`.\n\n"
        "## Dependency Order\n\n"
        f"{dep_lines}\n\n"
        "## Workflow\n\n"
        "1. Read source rules and extract mandatory constraints.\n"
        "2. Identify target files by matching rule globs.\n"
        "3. Apply role boundaries first, then capability-specific details.\n"
        "4. Verify no conflicts with upstream governance/foundation skills.\n"
        "5. Add or update tests when behavior changes.\n\n"
        "## Role Checklist\n\n"
        f"{checklist_lines}\n\n"
        "## Source Rules\n\n"
        f"{source_lines}\n"
    )


def openai_interface(name: str, meta: SkillMeta) -> tuple[str, str, str]:
    display_name = titleize(name)
    if meta.language == "general":
        short = "Global governance policy migration skill"
    elif meta.bucket == "foundation":
        short = f"{meta.language.capitalize()} baseline architecture skill"
    elif meta.bucket == "role":
        short = f"{meta.language.capitalize()} {meta.role} layer migration skill"
    else:
        short = f"{meta.language.capitalize()} domain capability migration skill"

    prompt = (
        f"Apply {name} by mapping source rules to actionable workflow constraints "
        "and enforce them on relevant files."
    )
    return display_name, short, prompt


def rename_migrated_dirs(skills_dir: Path, prefix: str) -> list[Path]:
    renamed: list[Path] = []
    for old_dir in sorted(skills_dir.glob(f"{prefix}*")):
        if not old_dir.is_dir():
            continue
        new_name = old_dir.name.removeprefix(prefix)
        new_dir = skills_dir / new_name
        if new_dir.exists():
            raise FileExistsError(f"Cannot rename {old_dir.name} -> {new_name}: target exists")
        old_dir.rename(new_dir)
        renamed.append(new_dir)
    return renamed


def refine_skill(
    skill_dir: Path,
    generator_script: Path,
) -> None:
    source_file = skill_dir / "references" / "source-rules.md"
    if not source_file.exists():
        return

    name = skill_dir.name
    meta = parse_source_rules(source_file)
    skill_file = skill_dir / "SKILL.md"
    skill_file.write_text(build_skill_markdown(name, meta), encoding="utf-8")

    display_name, short_description, default_prompt = openai_interface(name, meta)
    subprocess.run(
        [
            "python3",
            str(generator_script),
            str(skill_dir),
            "--interface",
            f"display_name={display_name}",
            "--interface",
            f"short_description={short_description}",
            "--interface",
            f"default_prompt={default_prompt}",
        ],
        check=True,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Refine migrated skill scaffolds and remove migration prefixes."
    )
    parser.add_argument(
        "--skills-dir",
        default=".agents/skills",
        help="Path to skills directory.",
    )
    parser.add_argument(
        "--prefix",
        default="migrated-",
        help="Prefix to remove from scaffolded skill names.",
    )
    parser.add_argument(
        "--generator-script",
        default="/home/jik/.codex/skills/.system/skill-creator/scripts/generate_openai_yaml.py",
        help="Path to generate_openai_yaml.py.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    skills_dir = Path(args.skills_dir).resolve()
    generator_script = Path(args.generator_script).resolve()

    rename_migrated_dirs(skills_dir, args.prefix)

    refined = 0
    for skill_dir in sorted(skills_dir.iterdir()):
        if not skill_dir.is_dir():
            continue
        if (skill_dir / "references" / "source-rules.md").exists():
            refine_skill(skill_dir, generator_script)
            refined += 1

    print(f"Refined skills: {refined}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
