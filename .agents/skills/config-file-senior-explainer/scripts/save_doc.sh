#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <name>" >&2
  exit 1
fi

raw_name="$1"
slug="$(printf '%s' "$raw_name" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g')"

if [ -z "$slug" ]; then
  echo "Error: name must include letters or digits." >&2
  exit 1
fi

docs_dir=".sisyphus/docs"
mkdir -p "$docs_dir"

output_path="$docs_dir/$slug.md"
cat > "$output_path"

echo "$output_path"
