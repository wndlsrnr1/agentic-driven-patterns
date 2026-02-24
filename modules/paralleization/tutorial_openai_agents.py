"""
tutorial_openai_agents.py

학습 목표:
1) openai-agents Python SDK의 Provider/Runner 구성 이해
2) 역할 분리된 Agent 두 개를 병렬 실행하는 방법 학습
3) 실행 결과(final_output)를 안전하게 텍스트로 정규화하는 방법 학습
"""

import asyncio
import json
import os
from typing import Any, Final

from tutorial_types import StepLogger, TutorialStepResult

STEP_ID: Final[str] = "step-3-openai-agents"
LIBRARY: Final[str] = "openai-agents"
OPENAI_MODEL: Final[str] = "gpt-4o-mini"
SYNTHETIC_MODEL: Final[str] = "hf:moonshotai/Kimi-K2.5"
SYNTHETIC_BASE_URL: Final[str] = "https://api.synthetic.new/openai/v1"


def _log_step(log: StepLogger, step_number: int, title: str) -> None:
    """공통 STEP 로그 포맷."""
    log(f"[openai-agents] STEP {step_number}/3 {title}")


def _to_text(value: Any) -> str:
    """튜토리얼 출력 형식을 문자열로 통일합니다."""
    if isinstance(value, str):
        return value

    return json.dumps(value, ensure_ascii=True, indent=2)


def _resolve_provider_config() -> tuple[str, str, str | None] | None:
    """키 입력은 최소화하고, 모델/URL은 학습용 상수로 고정합니다."""
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "").strip()
    if openai_api_key:
        return openai_api_key, OPENAI_MODEL, None

    synthetic_api_key: str = os.getenv("SYNTHETIC_API_KEY", "").strip()
    if synthetic_api_key:
        return synthetic_api_key, SYNTHETIC_MODEL, SYNTHETIC_BASE_URL

    return None


async def run_openai_agents_tutorial(log: StepLogger = print) -> TutorialStepResult:
    """OpenAI Agents 단계별 튜토리얼 실행."""
    # Step 1) 실행 준비
    _log_step(log, 1, "setup")
    provider_config: tuple[str, str, str | None] | None = _resolve_provider_config()
    if provider_config is None:
        return TutorialStepResult(
            step_id=STEP_ID,
            library="openai-agents",
            status="skipped",
            message="OPENAI_API_KEY or SYNTHETIC_API_KEY is missing.",
        )

    try:
        from agents import (
            Agent,
            OpenAIProvider,
            RunConfig,
            Runner,
            set_default_openai_api,
            set_default_openai_key,
        )
    except Exception as exception:  # noqa: BLE001
        return TutorialStepResult(
            step_id=STEP_ID,
            library="openai-agents",
            status="skipped",
            message=(
                "openai-agents package is not available. "
                f"Install requirement first. detail={exception}"
            ),
        )

    api_key: str
    model_name: str
    base_url: str | None
    api_key, model_name, base_url = provider_config

    # Step 2) Provider/Runner/Agent 구성
    _log_step(log, 2, "build two specialist agents")
    set_default_openai_key(api_key)
    set_default_openai_api("chat_completions")

    model_provider: OpenAIProvider = OpenAIProvider(
        api_key=api_key,
        base_url=base_url,
        use_responses=False,
    )
    run_config: RunConfig = RunConfig(model_provider=model_provider)

    biology_agent: Agent = Agent(
        name="BiologyExpert",
        model=model_name,
        instructions="You are a biology expert. Summarize CRISPR in one sentence.",
    )
    chemistry_agent: Agent = Agent(
        name="ChemistryExpert",
        model=model_name,
        instructions=(
            "You are a chemistry expert. "
            "Summarize solid-state batteries in one sentence."
        ),
    )

    # Step 3) 병렬 실행 + 결과 병합
    _log_step(log, 3, "execute in parallel with asyncio.gather")
    try:
        biology_task: asyncio.Task[Any] = asyncio.create_task(
            Runner.run(
                biology_agent,
                "Provide your summary.",
                max_turns=3,
                run_config=run_config,
            )
        )
        chemistry_task: asyncio.Task[Any] = asyncio.create_task(
            Runner.run(
                chemistry_agent,
                "Provide your summary.",
                max_turns=3,
                run_config=run_config,
            )
        )
        biology_result: Any
        chemistry_result: Any
        biology_result, chemistry_result = await asyncio.gather(
            biology_task,
            chemistry_task,
        )

        biology_output: Any = biology_result.final_output
        chemistry_output: Any = chemistry_result.final_output
        output: str = json.dumps(
            {
                "biology": _to_text(biology_output),
                "chemistry": _to_text(chemistry_output),
            },
            ensure_ascii=True,
            indent=2,
        )
        return TutorialStepResult(
            step_id=STEP_ID,
            library="openai-agents",
            status="completed",
            message="OpenAI Agents tutorial completed.",
            output=output,
        )
    except Exception as exception:  # noqa: BLE001
        return TutorialStepResult(
            step_id=STEP_ID,
            library="openai-agents",
            status="failed",
            message=str(exception),
        )


async def _main() -> None:
    """직접 실행 시 단일 step 결과를 JSON으로 출력합니다."""
    result: TutorialStepResult = await run_openai_agents_tutorial()
    print(json.dumps(result.__dict__, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    asyncio.run(_main())
