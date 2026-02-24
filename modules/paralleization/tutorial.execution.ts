import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * 현재 모듈이 "직접 실행된 경우"만 감지하는 공통 유틸리티입니다.
 * 테스트/임포트 상황에서 의도치 않은 자동 실행을 막기 위해 분리했습니다.
 */
export function isDirectExecution(
  moduleUrl: string,
  argv: readonly string[],
): boolean {
  const scriptPath: string | undefined = argv[1];
  if (!scriptPath) {
    return false;
  }

  const scriptUrl: string = pathToFileURL(resolve(scriptPath)).href;
  return scriptUrl === moduleUrl;
}
