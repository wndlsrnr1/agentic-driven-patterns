#!/usr/bin/env python3
"""Analyze `.agents/rules` and classify entries for migration planning."""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


@dataclass
class RuleEntry:
    path: str
    language: str
    tier: str
    role: str
    description: str
    globs: str
    always_apply: bool
    source_ext: str


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


def detect_language(rule_path: Path, rules_dir: Path) -> str:
    rel = rule_path.relative_to(rules_dir)
    parts = rel.parts
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


def read_rule_entry(rule_path: Path, rules_dir: Path) -> RuleEntry:
    text = rule_path.read_text(encoding="utf-8")
    fm = parse_frontmatter(text)

    language = detect_language(rule_path, rules_dir)
    stem = rule_path.stem
    role = detect_role(stem, language)
    tier = detect_tier(language, role)
    always_raw = fm.get("alwaysApply", "false").strip().lower()
    always_apply = always_raw in {"true", "1", "yes"}

    return RuleEntry(
        path=str(rule_path.relative_to(rules_dir)),
        language=language,
        tier=tier,
        role=role,
        description=fm.get("description", ""),
        globs=fm.get("globs", ""),
        always_apply=always_apply,
        source_ext=rule_path.suffix,
    )


def discover_rule_files(rules_dir: Path, include_md_fallback: bool) -> list[Path]:
    mdc_files = sorted(rules_dir.rglob("*.mdc"))
    if not include_md_fallback:
        return mdc_files

    files = list(mdc_files)
    for md_file in sorted(rules_dir.rglob("*.md")):
        if md_file.with_suffix(".mdc").exists():
            continue
        files.append(md_file)
    return files


def summarize(entries: Iterable[RuleEntry]) -> dict[str, dict[str, int]]:
    summary: dict[str, dict[str, int]] = {}
    for entry in entries:
        language_bucket = summary.setdefault(entry.language, {})
        language_bucket[entry.tier] = language_bucket.get(entry.tier, 0) + 1
    return summary


def to_markdown(entries: list[RuleEntry]) -> str:
    summary = summarize(entries)
    lines: list[str] = []
    lines.append("# Rule Inventory")
    lines.append("")
    lines.append(f"- Total rules: {len(entries)}")
    lines.append(f"- Languages: {', '.join(sorted(summary.keys()))}")
    lines.append("")
    lines.append("## Count by Language and Tier")
    lines.append("")
    lines.append("| language | L0 | L1 | L2 | L3 |")
    lines.append("|---|---:|---:|---:|---:|")
    for language in sorted(summary.keys()):
        tier_counts = summary[language]
        lines.append(
            "| {language} | {l0} | {l1} | {l2} | {l3} |".format(
                language=language,
                l0=tier_counts.get("L0-governance", 0),
                l1=tier_counts.get("L1-language-foundation", 0),
                l2=tier_counts.get("L2-layer-role", 0),
                l3=tier_counts.get("L3-domain-capability", 0),
            )
        )
    lines.append("")
    lines.append("## Rule Details")
    lines.append("")
    lines.append(
        "| path | language | tier | role | alwaysApply | globs | description |"
    )
    lines.append("|---|---|---|---|---|---|---|")
    for entry in entries:
        globs = (entry.globs or "-").replace("|", "\\|")
        desc = (entry.description or "-").replace("|", "\\|")
        lines.append(
            f"| `{entry.path}` | {entry.language} | {entry.tier} | {entry.role} | "
            f"{str(entry.always_apply).lower()} | `{globs}` | {desc} |"
        )
    lines.append("")
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Analyze rule hierarchy and role mapping for skill migration."
    )
    parser.add_argument(
        "--rules-dir",
        default=".agents/rules",
        help="Path to source rules directory (default: .agents/rules).",
    )
    parser.add_argument(
        "--include-md-fallback",
        action="store_true",
        help="Include .md files only when same-path .mdc does not exist.",
    )
    parser.add_argument(
        "--format",
        choices=("markdown", "json"),
        default="markdown",
        help="Output format.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    rules_dir = Path(args.rules_dir).resolve()
    if not rules_dir.exists():
        raise SystemExit(f"Rules directory not found: {rules_dir}")

    files = discover_rule_files(rules_dir, args.include_md_fallback)
    entries = [read_rule_entry(path, rules_dir) for path in files]
    entries.sort(key=lambda item: item.path)

    if args.format == "json":
        payload = {
            "total": len(entries),
            "summary": summarize(entries),
            "rules": [asdict(entry) for entry in entries],
        }
        print(json.dumps(payload, indent=2, ensure_ascii=False))
    else:
        print(to_markdown(entries))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
