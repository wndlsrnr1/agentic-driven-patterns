"""
tutorial_google_adk.py

학습 목표:
1) Google ADK의 LlmAgent 구성 이해
2) ParallelAgent로 병렬 조사 블록 구성
3) SequentialAgent로 병렬 결과를 합성 단계로 연결
"""

import asyncio
import json
import os
from typing import Final

from google.adk.agents import LlmAgent, ParallelAgent, SequentialAgent
from google.adk.tools import google_search

from tutorial_types import StepLogger, TutorialStepResult

STEP_ID: Final[str] = "step-1-google-adk"
LIBRARY: Final[str] = "google-adk"
MODEL_NAME: Final[str] = "gemini-2.0-flash"
TUTORIAL_TOPIC: Final[str] = "Artificial Intelligence in Healthcare"


def _log_step(log: StepLogger, step_number: int, title: str) -> None:
    """공통 STEP 로그 포맷."""
    log(f"[google-adk] STEP {step_number}/3 {title}")


def _resolve_api_key() -> str | None:
    """비밀키 입력 경로는 최소화: GEMINI -> GOOGLE 순으로 확인."""
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_api_key:
        return gemini_api_key

    google_api_key: str = os.getenv("GOOGLE_API_KEY", "").strip()
    if google_api_key:
        return google_api_key

    return None


def _build_pipeline(topic: str) -> SequentialAgent:
    """병렬 조사 + 합성 파이프라인을 선언적으로 조립합니다."""
    tech_researcher: LlmAgent = LlmAgent(
        name="TechResearcher",
        model=MODEL_NAME,
        instruction=(
            f"Research the technological advancements of '{topic}'. "
            "Summarize in one sentence."
        ),
        description="Researches technology aspects.",
        tools=[google_search],
    )
    market_researcher: LlmAgent = LlmAgent(
        name="MarketResearcher",
        model=MODEL_NAME,
        instruction=(
            f"Research the market impact of '{topic}'. "
            "Summarize in one sentence."
        ),
        description="Researches market impact.",
        tools=[google_search],
    )

    parallel_research: ParallelAgent = ParallelAgent(
        name="ParallelWebResearch",
        sub_agents=[tech_researcher, market_researcher],
        description="Runs multiple research agents in parallel.",
    )

    synthesis_agent: LlmAgent = LlmAgent(
        name="SynthesisAgent",
        model=MODEL_NAME,
        instruction="Combine the parallel research summaries into a concise report.",
        description="Combines parallel findings.",
    )

    pipeline: SequentialAgent = SequentialAgent(
        name="ResearchSynthesisPipeline",
        sub_agents=[parallel_research, synthesis_agent],
        description="Parallel research followed by synthesis.",
    )
    return pipeline


async def run_google_adk_tutorial(log: StepLogger = print) -> TutorialStepResult:
    """Google ADK 단계별 튜토리얼 실행."""
    # Step 1) 실행 준비
    _log_step(log, 1, "setup")
    api_key: str | None = _resolve_api_key()
    if api_key is None:
        return TutorialStepResult(
            step_id=STEP_ID,
            library="google-adk",
            status="skipped",
            message="GEMINI_API_KEY or GOOGLE_API_KEY is missing.",
        )

    # Step 2) 병렬 워크플로우 구성
    _log_step(log, 2, "build parallel workflow")
    os.environ["GOOGLE_API_KEY"] = api_key
    pipeline: SequentialAgent = _build_pipeline(TUTORIAL_TOPIC)

    # Step 3) 실행 후 결과 수집
    _log_step(log, 3, "execute and collect output")
    try:
        from google.adk.agents import InvocationContext

        context: InvocationContext = InvocationContext()
        events: list[str] = []
        async for event in pipeline.run_async(context):
            events.append(str(event))

        output: str = "\n".join(events[-5:]) if events else "No ADK events emitted."
        return TutorialStepResult(
            step_id=STEP_ID,
            library="google-adk",
            status="completed",
            message="Google ADK tutorial completed.",
            output=output,
        )
    except Exception as exception:  # noqa: BLE001
        return TutorialStepResult(
            step_id=STEP_ID,
            library="google-adk",
            status="failed",
            message=str(exception),
        )


async def _main() -> None:
    """직접 실행 시 단일 step 결과를 JSON으로 출력합니다."""
    result: TutorialStepResult = await run_google_adk_tutorial()
    print(json.dumps(result.__dict__, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    asyncio.run(_main())
