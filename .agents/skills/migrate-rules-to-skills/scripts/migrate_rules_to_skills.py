#!/usr/bin/env python3
"""Generate migration plans and optional skill scaffolds from `.agents/rules`."""

from __future__ import annotations

import argparse
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from analyze_rules import RuleEntry, discover_rule_files, read_rule_entry


@dataclass
class SkillGroup:
    language: str
    bucket: str
    role: str
    rules: list[RuleEntry]

    @property
    def key(self) -> tuple[str, str, str]:
        return (self.language, self.bucket, self.role)


def slugify(text: str) -> str:
    value = text.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value


def normalize_skill_name(name: str) -> str:
    normalized = slugify(name)
    if len(normalized) <= 63:
        return normalized
    return normalized[:63].rstrip("-")


def to_bucket(entry: RuleEntry) -> tuple[str, str]:
    if entry.tier == "L0-governance":
        return ("governance", "governance")
    if entry.tier == "L1-language-foundation":
        return ("foundation", "foundation")
    if entry.tier == "L2-layer-role":
        return ("role", entry.role)
    return ("capability", entry.role)


def build_groups(entries: Iterable[RuleEntry]) -> list[SkillGroup]:
    grouped: dict[tuple[str, str, str], list[RuleEntry]] = defaultdict(list)
    for entry in entries:
        bucket, role = to_bucket(entry)
        grouped[(entry.language, bucket, role)].append(entry)

    groups: list[SkillGroup] = []
    for key in sorted(grouped.keys()):
        rules = sorted(grouped[key], key=lambda item: item.path)
        groups.append(SkillGroup(language=key[0], bucket=key[1], role=key[2], rules=rules))
    return groups


def build_skill_name(group: SkillGroup, prefix: str) -> str:
    if group.language == "general":
        core = f"rules-{group.role}"
    elif group.bucket == "foundation":
        core = f"{group.language}-foundation-rules"
    elif group.bucket == "role":
        core = f"{group.language}-{group.role}-rules"
    else:
        capability_role = group.role if group.role not in {"capability", "misc"} else "domain"
        core = f"{group.language}-{capability_role}-capability-rules"
    return normalize_skill_name(f"{prefix}{core}")


def build_description(group: SkillGroup) -> str:
    if group.language == "general":
        return (
            "Repository-wide governance rules migrated from `.agents/rules/general`. "
            "Use when defining global policy, rule authoring standards, or baseline constraints."
        )
    if group.bucket == "foundation":
        return (
            f"{group.language.capitalize()} architecture foundation rules migrated from "
            f"`.agents/rules/{group.language}`. Use when setting base patterns before layer-specific work."
        )
    if group.bucket == "role":
        return (
            f"{group.language.capitalize()} {group.role} responsibilities migrated from "
            f"`.agents/rules/{group.language}`. Use when implementing or reviewing {group.role} layer work."
        )
    capability_role = group.role if group.role not in {"capability", "misc"} else "domain"
    return (
        f"{group.language.capitalize()} capability-specific rules ({capability_role}) migrated from "
        f"`.agents/rules/{group.language}`. Use for focused feature or domain workflows."
    )


def title_from_name(name: str) -> str:
    return " ".join(part.capitalize() for part in name.split("-"))


def build_skill_markdown(name: str, group: SkillGroup) -> str:
    source_lines = "\n".join(f"- `{entry.path}`" for entry in group.rules)
    return (
        f"---\n"
        f"name: {name}\n"
        f"description: {build_description(group)}\n"
        f"---\n\n"
        f"# {title_from_name(name)}\n\n"
        f"## Overview\n\n"
        f"Use this skill as the migrated target for `{group.language}` `{group.role}` rule guidance.\n\n"
        f"## Source Rules\n\n"
        f"{source_lines}\n\n"
        f"## Migration Tasks\n\n"
        f"1. Read all source rules listed above.\n"
        f"2. Convert static constraints into actionable workflow steps.\n"
        f"3. Keep examples concise and role-scoped.\n"
        f"4. Validate the skill with `quick_validate.py`.\n"
    )


def build_source_reference(group: SkillGroup) -> str:
    lines: list[str] = []
    lines.append("# Source Rule Mapping")
    lines.append("")
    lines.append(f"- Language: `{group.language}`")
    lines.append(f"- Bucket: `{group.bucket}`")
    lines.append(f"- Role: `{group.role}`")
    lines.append("")
    lines.append("| rule | globs | alwaysApply | description |")
    lines.append("|---|---|---|---|")
    for entry in group.rules:
        globs = (entry.globs or "-").replace("|", "\\|")
        description = (entry.description or "-").replace("|", "\\|")
        lines.append(
            f"| `{entry.path}` | `{globs}` | {str(entry.always_apply).lower()} | {description} |"
        )
    lines.append("")
    return "\n".join(lines)


def build_plan(groups: list[SkillGroup], prefix: str) -> str:
    lines: list[str] = []
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
    lines.append("# Rules to Skills Migration Plan")
    lines.append("")
    lines.append(f"- Generated at: {generated_at}")
    lines.append(f"- Proposed groups: {len(groups)}")
    lines.append("")
    lines.append("## Proposed Skill Groups")
    lines.append("")
    for group in groups:
        skill_name = build_skill_name(group, prefix)
        lines.append(f"### `{skill_name}`")
        lines.append("")
        lines.append(f"- language: `{group.language}`")
        lines.append(f"- bucket: `{group.bucket}`")
        lines.append(f"- role: `{group.role}`")
        lines.append(f"- source rule count: {len(group.rules)}")
        lines.append("- source rules:")
        for entry in group.rules:
            lines.append(f"  - `{entry.path}`")
        lines.append("")
    return "\n".join(lines)


def scaffold_groups(
    groups: list[SkillGroup],
    skills_dir: Path,
    prefix: str,
    overwrite: bool,
) -> tuple[int, int]:
    created = 0
    skipped = 0

    skills_dir.mkdir(parents=True, exist_ok=True)
    for group in groups:
        skill_name = build_skill_name(group, prefix)
        skill_path = skills_dir / skill_name
        skill_file = skill_path / "SKILL.md"
        ref_file = skill_path / "references" / "source-rules.md"

        if skill_path.exists() and not overwrite:
            skipped += 1
            continue

        (skill_path / "references").mkdir(parents=True, exist_ok=True)
        skill_file.write_text(build_skill_markdown(skill_name, group), encoding="utf-8")
        ref_file.write_text(build_source_reference(group), encoding="utf-8")
        created += 1

    return (created, skipped)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create role-aware migration plans from rules to skills."
    )
    parser.add_argument(
        "--rules-dir",
        default=".agents/rules",
        help="Path to source rules directory (default: .agents/rules).",
    )
    parser.add_argument(
        "--skills-dir",
        default=".agents/skills",
        help="Path to target skills directory for scaffolding (default: .agents/skills).",
    )
    parser.add_argument(
        "--prefix",
        default="",
        help="Prefix for generated skill names (for example, migrated-).",
    )
    parser.add_argument(
        "--include-md-fallback",
        action="store_true",
        help="Include .md files only when same-path .mdc does not exist.",
    )
    parser.add_argument(
        "--plan-out",
        help="Optional output path for markdown migration plan.",
    )
    parser.add_argument(
        "--scaffold",
        action="store_true",
        help="Scaffold grouped skill folders under --skills-dir.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing scaffolded skill folders.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    rules_dir = Path(args.rules_dir).resolve()
    skills_dir = Path(args.skills_dir).resolve()
    prefix = slugify(args.prefix) + "-" if args.prefix and not args.prefix.endswith("-") else args.prefix

    if not rules_dir.exists():
        raise SystemExit(f"Rules directory not found: {rules_dir}")

    files = discover_rule_files(rules_dir, args.include_md_fallback)
    entries = [read_rule_entry(path, rules_dir) for path in files]
    entries.sort(key=lambda item: item.path)
    groups = build_groups(entries)
    plan = build_plan(groups, prefix)

    if args.plan_out:
        out_path = Path(args.plan_out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(plan, encoding="utf-8")
    else:
        print(plan)

    if args.scaffold:
        created, skipped = scaffold_groups(groups, skills_dir, prefix, args.overwrite)
        print(f"\nScaffolded skills: created={created}, skipped={skipped}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
