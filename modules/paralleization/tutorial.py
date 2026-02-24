"""
tutorial.py

튜토리얼 인덱스 실행기.
- 라이브러리별 학습 스텝 파일(google/langchain/openai-agents)을 순서대로 실행합니다.
- 각 step의 실패를 개별 결과로 격리하여 전체 학습 흐름이 중단되지 않도록 설계했습니다.
"""

import asyncio
import json
from dataclasses import asdict
from datetime import datetime, timezone
from typing import Final, Sequence

from tutorial_google_adk import run_google_adk_tutorial
from tutorial_langchain import run_langchain_tutorial
from tutorial_openai_agents import run_openai_agents_tutorial
from tutorial_types import RunTutorialResult, StepLogger, StepRunner, TutorialLibrary, TutorialStepResult

GOOGLE_ADK_STEP_ID: Final[str] = "step-1-google-adk"
LANGCHAIN_STEP_ID: Final[str] = "step-2-langchain"
OPENAI_AGENTS_STEP_ID: Final[str] = "step-3-openai-agents"


def _log(message: str) -> None:
    """기본 로거. 튜토리얼 로그를 표준 출력으로 보냅니다."""
    print(message)


async def run_tutorial(
    target_libraries: Sequence[TutorialLibrary] | None = None,
    log: StepLogger = _log,
    step_runners: list[tuple[str, TutorialLibrary, StepRunner]] | None = None,
) -> RunTutorialResult:
    """전체 튜토리얼 실행 오케스트레이션."""
    started_at_iso: str = datetime.now(timezone.utc).isoformat()
    steps: list[TutorialStepResult] = []

    runtime_step_runners: list[tuple[str, TutorialLibrary, StepRunner]] = (
        step_runners
        if step_runners is not None
        else [
            (GOOGLE_ADK_STEP_ID, "google-adk", run_google_adk_tutorial),
            (LANGCHAIN_STEP_ID, "langchain", run_langchain_tutorial),
            (OPENAI_AGENTS_STEP_ID, "openai-agents", run_openai_agents_tutorial),
        ]
    )

    selected_libraries: set[TutorialLibrary] | None = (
        set(target_libraries) if target_libraries is not None else None
    )

    # 실행 시작 로그
    log("[tutorial.py] start")
    if selected_libraries is not None and len(selected_libraries) > 0:
        log(f"[tutorial.py] target-libraries: {sorted(selected_libraries)}")

    for step_id, library, step_runner in runtime_step_runners:
        if selected_libraries is not None and library not in selected_libraries:
            continue

        log(f"[tutorial.py] step-start {step_id}")
        try:
            # step 실패가 전체 중단으로 번지지 않도록 개별 예외 처리
            step_result: TutorialStepResult = await step_runner(log)
            steps.append(step_result)
            log(
                f"[tutorial.py] step-{step_result.status} "
                f"{step_result.step_id}: {step_result.message}"
            )
        except Exception as exception:  # noqa: BLE001
            error_message: str = str(exception)
            failed_result: TutorialStepResult = TutorialStepResult(
                step_id=step_id,
                library=library,
                status="failed",
                message=error_message,
            )
            steps.append(failed_result)
            log(f"[tutorial.py] step-failed {step_id}: {error_message}")

    completed_at_iso: str = datetime.now(timezone.utc).isoformat()
    result: RunTutorialResult = RunTutorialResult(
        steps=steps,
        started_at_iso=started_at_iso,
        completed_at_iso=completed_at_iso,
    )
    log("[tutorial.py] completed")
    return result


async def _main() -> None:
    """CLI 진입점: 전체 튜토리얼을 실행하고 JSON 결과를 출력합니다."""
    result: RunTutorialResult = await run_tutorial()
    print(json.dumps(asdict(result), indent=2, ensure_ascii=True))


if __name__ == "__main__":
    asyncio.run(_main())
