#!/usr/bin/env python3
"""Embed full disabled rule text into skill files."""

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass
class RuleEntry:
    disabled_path: Path
    logical_path: str
    language: str
    tier: str
    role: str
    description: str
    globs: str
    always_apply: bool
    text: str


FOUNDATION_NAMES = {
    "always",
    "common-principles",
    "react-common",
    "spring-architecture",
    "django-artitecture",
    "django-development",
}

L2_ROLES = {
    "controller",
    "service",
    "repository",
    "domain-model",
    "io-validation",
    "security",
    "testing",
    "platform",
    "async",
}


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        return {}

    lines = text.splitlines()
    if not lines or lines[0] != "---":
        return {}

    data: dict[str, str] = {}
    for raw in lines[1:]:
        if raw == "---":
            break
        if ":" not in raw:
            continue
        key, value = raw.split(":", 1)
        data[key.strip()] = value.strip().strip('"').strip("'")
    return data


def detect_language(logical_path: str) -> str:
    parts = Path(logical_path).parts
    if len(parts) == 1:
        return "general"
    first = parts[0]
    if first in {"general", "java", "python", "typescript"}:
        return first
    return first


def detect_role(stem: str, language: str) -> str:
    name = stem.lower()
    tokens = {token for token in re.split(r"[^a-z0-9]+", name) if token}

    def has_any(*candidates: str) -> bool:
        return any(candidate in tokens for candidate in candidates)

    if language == "general":
        if "cursor_rules" in name:
            return "rule-authoring"
        return "governance"

    if name in FOUNDATION_NAMES:
        return "foundation"
    if has_any("controller", "controllers", "rest", "view", "views", "url", "urls"):
        return "controller"
    if has_any("service", "services"):
        return "service"
    if has_any("repository", "repositories", "jpa"):
        return "repository"
    if has_any("entity", "entities", "model", "models", "domain", "domains"):
        return "domain-model"
    if has_any(
        "dto",
        "dtos",
        "serializer",
        "serializers",
        "request",
        "requests",
        "response",
        "responses",
        "validation",
        "validations",
        "form",
        "forms",
    ):
        return "io-validation"
    if has_any("security", "auth", "authentication", "authorization"):
        return "security"
    if has_any("test", "tests", "testing"):
        return "testing"
    if has_any("config", "configuration", "middleware", "settings"):
        return "platform"
    if has_any("async", "task", "tasks", "scheduler", "schedulers"):
        return "async"
    if has_any(
        "ai",
        "summarization",
        "stt",
        "integration",
        "performance",
        "optimization",
        "pagination",
        "documentize",
        "plan",
    ):
        return "capability"
    return "misc"


def detect_tier(language: str, role: str) -> str:
    if language == "general":
        return "L0-governance"
    if role == "foundation":
        return "L1-language-foundation"
    if role in L2_ROLES:
        return "L2-layer-role"
    return "L3-domain-capability"


def discover_disabled_rules(rules_dir: Path) -> list[RuleEntry]:
    mdc_disabled = sorted(rules_dir.rglob("*.mdc.disabled"))
    md_disabled = sorted(rules_dir.rglob("*.md.disabled"))

    selected: list[Path] = list(mdc_disabled)
    mdc_logical = {
        str(path.relative_to(rules_dir)).removesuffix(".disabled")
        for path in mdc_disabled
    }

    for md_path in md_disabled:
        logical_md = str(md_path.relative_to(rules_dir)).removesuffix(".disabled")
        logical_mdc = logical_md.removesuffix(".md") + ".mdc"
        if logical_mdc in mdc_logical:
            continue
        selected.append(md_path)

    entries: list[RuleEntry] = []
    for path in sorted(selected):
        text = path.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        logical_path = str(path.relative_to(rules_dir)).removesuffix(".disabled")
        if logical_path == "python/plan.md":
            continue
        language = detect_language(logical_path)
        stem = Path(logical_path).stem
        role = detect_role(stem, language)
        tier = detect_tier(language, role)
        always_apply = fm.get("alwaysApply", "false").strip().lower() in {
            "true",
            "1",
            "yes",
        }
        entries.append(
            RuleEntry(
                disabled_path=path,
                logical_path=logical_path,
                language=language,
                tier=tier,
                role=role,
                description=fm.get("description", ""),
                globs=fm.get("globs", ""),
                always_apply=always_apply,
                text=text.rstrip() + "\n",
            )
        )
    return entries


@dataclass
class SkillGroup:
    language: str
    bucket: str
    role: str
    rules: list[RuleEntry]


def to_bucket(entry: RuleEntry) -> tuple[str, str]:
    if entry.tier == "L0-governance":
        return ("governance", "governance")
    if entry.tier == "L1-language-foundation":
        return ("foundation", "foundation")
    if entry.tier == "L2-layer-role":
        return ("role", entry.role)
    return ("capability", entry.role)


def build_groups(entries: Iterable[RuleEntry]) -> list[SkillGroup]:
    grouped: dict[tuple[str, str, str], list[RuleEntry]] = {}
    for entry in entries:
        bucket, role = to_bucket(entry)
        key = (entry.language, bucket, role)
        grouped.setdefault(key, []).append(entry)

    groups: list[SkillGroup] = []
    for key in sorted(grouped.keys()):
        rules = sorted(grouped[key], key=lambda item: item.logical_path)
        groups.append(SkillGroup(language=key[0], bucket=key[1], role=key[2], rules=rules))
    return groups


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


def build_skill_name(group: SkillGroup) -> str:
    if group.language == "general":
        core = f"rules-{group.role}"
    elif group.bucket == "foundation":
        core = f"{group.language}-foundation-rules"
    elif group.bucket == "role":
        core = f"{group.language}-{group.role}-rules"
    else:
        capability_role = group.role if group.role not in {"capability", "misc"} else "domain"
        core = f"{group.language}-{capability_role}-capability-rules"
    return normalize_skill_name(core)


def build_full_embed_section(group: SkillGroup) -> str:
    lines: list[str] = []
    lines.append("## Embedded Rule Sources (Full Text)")
    lines.append("")
    for rule in group.rules:
        lines.append(f"### `{rule.logical_path}`")
        lines.append(f"- Scope (globs): `{rule.globs or '-'}`")
        lines.append(f"- alwaysApply: `{str(rule.always_apply).lower()}`")
        lines.append("")
        lines.append("````md")
        lines.append(rule.text.rstrip("\n"))
        lines.append("````")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def remove_existing_embed_sections(text: str) -> str:
    markers = [
        "\n## Embedded Rule Sources (Full Text)\n",
        "\n## 내장 룰 원문\n",
        "\n## Embedded Policy Pack\n",
        "\n## Source Lineage (Disabled Rules)\n",
        "\n## Source Rules\n",
    ]
    cut = len(text)
    for marker in markers:
        idx = text.find(marker)
        if idx != -1:
            cut = min(cut, idx)
    return text[:cut].rstrip() + "\n\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Embed full disabled rule text into generated skills."
    )
    parser.add_argument(
        "--rules-dir",
        default=".agents/rules",
        help="Path to disabled rules directory.",
    )
    parser.add_argument(
        "--skills-dir",
        default=".agents/skills",
        help="Path to skills directory.",
    )
    parser.add_argument(
        "--only",
        nargs="*",
        help="Optional list of skill names to update.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    rules_dir = Path(args.rules_dir).resolve()
    skills_dir = Path(args.skills_dir).resolve()
    only = set(args.only or [])

    entries = discover_disabled_rules(rules_dir)
    groups = build_groups(entries)

    updated = 0
    missing = 0

    for group in groups:
        skill_name = build_skill_name(group)
        if only and skill_name not in only:
            continue

        skill_file = skills_dir / skill_name / "SKILL.md"
        if not skill_file.exists():
            missing += 1
            continue

        current = skill_file.read_text(encoding="utf-8")
        prefix = remove_existing_embed_sections(current)
        full_section = build_full_embed_section(group)
        skill_file.write_text(prefix + full_section, encoding="utf-8")
        updated += 1

    print(f"Updated skills: {updated}")
    print(f"Missing skill files: {missing}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
