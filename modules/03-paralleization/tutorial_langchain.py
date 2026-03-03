import asyncio
import json
import os
from dataclasses import dataclass
from operator import itemgetter
from typing import Any, Final

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable, RunnableParallel
from langchain_openai import ChatOpenAI

from tutorial_types import StepLogger, TutorialStepResult

STEP_ID: Final[str] = "step-2-langchain"
LIBRARY: Final[str] = "langchain"


@dataclass(frozen=True)
class LangchainConfig:
    api_key: str
    model_name: str
    base_url: str | None
    topic: str


def resolve_langchain_config() -> LangchainConfig | None:
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "").strip()
    if openai_api_key:
        return LangchainConfig(
            api_key=openai_api_key,
            model_name="gpt-4o-mini",
            base_url=None,
            topic="Artificial Intelligence in Healthcare",
        )

    synthetic_api_key: str = os.getenv("SYNTHETIC_API_KEY", "").strip()
    if synthetic_api_key:
        return LangchainConfig(
            api_key=synthetic_api_key,
            model_name="hf:moonshotai/Kimi-K2.5",
            base_url="https://api.synthetic.new/openai/v1",
            topic="Artificial Intelligence in Healthcare",
        )

    return None


async def run_langchain_tutorial(log: StepLogger = print) -> TutorialStepResult:
    config: LangchainConfig | None = resolve_langchain_config()
    if config is None:
        return TutorialStepResult(
            step_id=STEP_ID,
            library=LIBRARY,
            status="skipped",
            message="OPENAI_API_KEY or SYNTHETIC_API_KEY is missing.",
        )

    log("[langchain] STEP 1/3 setup")
    llm: ChatOpenAI = ChatOpenAI(
        model=config.model_name,
        temperature=0.2,
        api_key=config.api_key,
        base_url=config.base_url,
    )
    parser: StrOutputParser = StrOutputParser()

    summary_chain: Runnable[Any, str] = (
        ChatPromptTemplate.from_messages(
            [
                ("system", "Summarize the following topic in one sentence."),
                ("user", "{topic}"),
            ]
        )
        | llm
        | parser
    )
    questions_chain: Runnable[Any, str] = (
        ChatPromptTemplate.from_messages(
            [
                ("system", "Generate two interesting questions for this topic."),
                ("user", "{topic}"),
            ]
        )
        | llm
        | parser
    )
    keywords_chain: Runnable[Any, str] = (
        ChatPromptTemplate.from_messages(
            [
                ("system", "Extract three key terms as comma-separated text."),
                ("user", "{topic}"),
            ]
        )
        | llm
        | parser
    )

    parallel_chain: RunnableParallel = RunnableParallel(
        {
            "summary": summary_chain,
            "questions": questions_chain,
            "keywords": keywords_chain,
            "topic": itemgetter("topic"),
        }
    )

    log("[langchain] STEP 2/3 run")
    try:
        result: dict[str, str] = await parallel_chain.ainvoke({"topic": config.topic})
        output: str = json.dumps(result, indent=2, ensure_ascii=True)
        return TutorialStepResult(
            step_id=STEP_ID,
            library=LIBRARY,
            status="completed",
            message="LangChain tutorial completed.",
            output=output,
        )
    except Exception as exception:  # noqa: BLE001
        return TutorialStepResult(
            step_id=STEP_ID,
            library=LIBRARY,
            status="failed",
            message=str(exception),
        )


async def _main() -> None:
    result: TutorialStepResult = await run_langchain_tutorial()
    print(json.dumps(result.__dict__, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    asyncio.run(_main())
