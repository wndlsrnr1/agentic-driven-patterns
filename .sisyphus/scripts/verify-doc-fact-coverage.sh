#!/usr/bin/env bash
set -euo pipefail

scope="${1:-all}"

doc_dir=".sisyphus/docs"

check_pattern() {
  local pattern="$1"
  local file="$2"
  if ! rg -n --fixed-strings "$pattern" "$file" >/dev/null; then
    echo "[MISS] $file :: $pattern"
    return 1
  fi
  echo "[OK]   $file :: $pattern"
}

runtime_checks() {
  check_pattern "Build Context" "$doc_dir/server-dockerignore-config-explained.md"
  check_pattern "ADP_BUILD_MODE" "$doc_dir/server-dockerfile-config-explained.md"
  check_pattern "lock 기반 설치" "$doc_dir/server-dockerfile-config-explained.md"
  check_pattern "scripts.build" "$doc_dir/server-package-json-config-explained.md"
  check_pattern "NODE_OPTIONS=--experimental-vm-modules" "$doc_dir/server-package-json-config-explained.md"
}

toolchain_checks() {
  check_pattern "extensionsToTreatAsEsm" "$doc_dir/server-jest-config-ts-config-explained.md"
  check_pattern "moduleNameMapper" "$doc_dir/server-jest-config-ts-config-explained.md"
  check_pattern "sourceRoot" "$doc_dir/server-nest-cli-json-config-explained.md"
  check_pattern "deleteOutDir" "$doc_dir/server-nest-cli-json-config-explained.md"
  check_pattern "outDir" "$doc_dir/server-tsconfig-build-docker-json-config-explained.md"
  check_pattern "**/*spec.ts" "$doc_dir/server-tsconfig-build-json-config-explained.md"
  check_pattern "NodeNext" "$doc_dir/server-tsconfig-json-config-explained.md"
  check_pattern "strict" "$doc_dir/server-tsconfig-json-config-explained.md"
}

lockfile_checks() {
  check_pattern "lockfileVersion" "$doc_dir/server-package-lock-json-config-explained.md"
  check_pattern "packages" "$doc_dir/server-package-lock-json-config-explained.md"
  check_pattern "node_modules/@nestjs/common" "$doc_dir/server-package-lock-json-config-explained.md"
  check_pattern "node_modules/ts-jest" "$doc_dir/server-package-lock-json-config-explained.md"
  check_pattern "node_modules/typescript" "$doc_dir/server-package-lock-json-config-explained.md"
  check_pattern "node_modules/@langchain/openai" "$doc_dir/server-package-lock-json-config-explained.md"
}

index_checks() {
  check_pattern "ADP_BUILD_MODE -> package.json -> tsconfig.build*.json -> Dockerfile" "$doc_dir/server-config-chain-explained.md"
  check_pattern "jest.config.ts <-> tsconfig.json(NodeNext/ESM)" "$doc_dir/server-config-chain-explained.md"
  check_pattern "변경 전 공통 체크리스트" "$doc_dir/server-config-chain-explained.md"
}

common_checks() {
  for f in "$doc_dir"/*.md; do
    check_pattern "30초 요약" "$f"
  done
}

case "$scope" in
  runtime)
    runtime_checks
    ;;
  toolchain)
    toolchain_checks
    ;;
  all)
    runtime_checks
    toolchain_checks
    lockfile_checks
    index_checks
    common_checks
    ;;
  *)
    echo "usage: $0 [runtime|toolchain|all]" >&2
    exit 2
    ;;
esac

echo "Fact coverage verification passed for scope: $scope"
