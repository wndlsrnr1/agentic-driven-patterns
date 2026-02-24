"""
tutorial_langchain.py

학습 목표:
1) LangChain LCEL(프롬프트 -> 모델 -> 파서) 조합 이해
2) RunnableParallel로 병렬 작업 구성
3) 병렬 결과를 구조화된 JSON으로 반환하는 흐름 학습
"""

import asyncio
import json
import os
from operator import itemgetter
from typing import Any, Final

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable, RunnableParallel
from langchain_openai import ChatOpenAI

from tutorial_types import StepLogger, TutorialStepResult

STEP_ID: Final[str] = "step-2-langchain"
LIBRARY: Final[str] = "langchain"
OPENAI_MODEL: Final[str] = "gpt-4o-mini"
SYNTHETIC_MODEL: Final[str] = "hf:moonshotai/Kimi-K2.5"
SYNTHETIC_BASE_URL: Final[str] = "https://api.synthetic.new/openai/v1"
TUTORIAL_TOPIC: Final[str] = "Artificial Intelligence in Healthcare"


def _log_step(log: StepLogger, step_number: int, title: str) -> None:
    """공통 STEP 로그 포맷."""
    log(f"[langchain] STEP {step_number}/3 {title}")


def _resolve_model_config() -> tuple[str, str, str | None] | None:
    """키 입력은 최소화하고 모델/URL은 학습용 상수로 고정합니다."""
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "").strip()
    if openai_api_key:
        return openai_api_key, OPENAI_MODEL, None

    synthetic_api_key: str = os.getenv("SYNTHETIC_API_KEY", "").strip()
    if synthetic_api_key:
        return synthetic_api_key, SYNTHETIC_MODEL, SYNTHETIC_BASE_URL

    return None


def _build_parallel_chain(llm: ChatOpenAI) -> Runnable[Any, dict[str, str]]:
    """요약/질문/키워드 체인을 병렬로 실행하는 runnable을 만듭니다."""
    summarize_chain: Runnable[Any, str] = (
        ChatPromptTemplate.from_messages(
            [
                ("system", "Summarize the following topic in one sentence."),
                ("user", "{topic}"),
            ]
        )
        | llm
        | StrOutputParser()
    )

    questions_chain: Runnable[Any, str] = (
        ChatPromptTemplate.from_messages(
            [
                ("system", "Generate two interesting questions for this topic."),
                ("user", "{topic}"),
            ]
        )
        | llm
        | StrOutputParser()
    )

    keywords_chain: Runnable[Any, str] = (
        ChatPromptTemplate.from_messages(
            [
                ("system", "Extract three key terms as comma-separated text."),
                ("user", "{topic}"),
            ]
        )
        | llm
        | StrOutputParser()
    )

    parallel_chain: RunnableParallel = RunnableParallel(
        {
            "summary": summarize_chain,
            "questions": questions_chain,
            "keywords": keywords_chain,
            "topic": itemgetter("topic"),
        }
    )
    return parallel_chain


async def run_langchain_tutorial(log: StepLogger = print) -> TutorialStepResult:
    """LangChain 단계별 튜토리얼 실행."""
    # Step 1) 실행 준비
    _log_step(log, 1, "setup")
    model_config: tuple[str, str, str | None] | None = _resolve_model_config()
    if model_config is None:
        return TutorialStepResult(
            step_id=STEP_ID,
            library="langchain",
            status="skipped",
            message="OPENAI_API_KEY or SYNTHETIC_API_KEY is missing.",
        )

    api_key: str
    model_name: str
    base_url: str | None
    api_key, model_name, base_url = model_config

    llm: ChatOpenAI = ChatOpenAI(
        model=model_name,
        temperature=0.2,
        api_key=api_key,
        base_url=base_url,
    )

    # Step 2) 병렬 runnable 구성
    _log_step(log, 2, "build parallel runnable")
    langchain_pipeline: Runnable[Any, dict[str, str]] = _build_parallel_chain(llm)

    # Step 3) 실행 및 출력 수집
    _log_step(log, 3, "execute and collect output")
    try:
        lc_result: dict[str, str] = await langchain_pipeline.ainvoke(
            {"topic": TUTORIAL_TOPIC}
        )
        output: str = json.dumps(lc_result, indent=2, ensure_ascii=True)
        return TutorialStepResult(
            step_id=STEP_ID,
            library="langchain",
            status="completed",
            message="LangChain tutorial completed.",
            output=output,
        )
    except Exception as exception:  # noqa: BLE001
        return TutorialStepResult(
            step_id=STEP_ID,
            library="langchain",
            status="failed",
            message=str(exception),
        )


async def _main() -> None:
    """직접 실행 시 단일 step 결과를 JSON으로 출력합니다."""
    result: TutorialStepResult = await run_langchain_tutorial()
    print(json.dumps(result.__dict__, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    asyncio.run(_main())
