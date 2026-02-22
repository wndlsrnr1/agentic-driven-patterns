#!/usr/bin/env bash
set -euo pipefail

doc_dir=".sisyphus/docs"

required_docs=(
  "server-config-chain-explained.md"
  "server-dockerfile-config-explained.md"
  "server-dockerignore-config-explained.md"
  "server-jest-config-ts-config-explained.md"
  "server-nest-cli-json-config-explained.md"
  "server-package-json-config-explained.md"
  "server-package-lock-json-config-explained.md"
  "server-tsconfig-build-docker-json-config-explained.md"
  "server-tsconfig-build-json-config-explained.md"
  "server-tsconfig-json-config-explained.md"
)

for d in "${required_docs[@]}"; do
  test -f "$doc_dir/$d"
  echo "[OK] file exists: $d"
done

for d in "${required_docs[@]}"; do
  rg -n --fixed-strings "30초 요약" "$doc_dir/$d" >/dev/null
  echo "[OK] summary card: $d"
done

# 9 detailed docs should have section 0~9
for d in "${required_docs[@]}"; do
  if [[ "$d" == "server-config-chain-explained.md" ]]; then
    continue
  fi
  count=$(rg -n '^## [0-9]\.' "$doc_dir/$d" | wc -l | tr -d ' ')
  if [[ "$count" -ne 10 ]]; then
    echo "[MISS] section count !=10: $d ($count)" >&2
    exit 1
  fi
  echo "[OK] sections 0~9: $d"
done

# index links and required flows
rg -n "server-.*-config-explained\.md" "$doc_dir/server-config-chain-explained.md" | wc -l | awk '{ if ($1 < 9) { exit 1 } }'
rg -n --fixed-strings "ADP_BUILD_MODE -> package.json -> tsconfig.build*.json -> Dockerfile" "$doc_dir/server-config-chain-explained.md" >/dev/null
rg -n --fixed-strings "jest.config.ts <-> tsconfig.json(NodeNext/ESM)" "$doc_dir/server-config-chain-explained.md" >/dev/null
rg -n --fixed-strings "변경 전 공통 체크리스트" "$doc_dir/server-config-chain-explained.md" >/dev/null
echo "[OK] index integrity"

# lockfile key samples
rg -n '""|@nestjs/common|ts-jest|typescript|@langchain/openai|lockfileVersion|packages' "$doc_dir/server-package-lock-json-config-explained.md" >/dev/null
echo "[OK] lockfile samples"

# fact coverage script
bash .sisyphus/scripts/verify-doc-fact-coverage.sh all

echo "All config-doc verification checks passed."
