import asyncio
import json
import os
from dataclasses import dataclass
from typing import Any

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable
from langchain_core.runnables import RunnableParallel
from langchain_openai import ChatOpenAI


@dataclass(frozen=True)
class LangchainWorkflowConfig:
    api_key: str
    model_name: str
    base_url: str
    topic: str


def resolve_langchain_config() -> LangchainWorkflowConfig:
    api_key: str = os.getenv("API_KEY", "").strip()
    if api_key == "":
        raise ValueError("API_KEY is missing.")

    return LangchainWorkflowConfig(
        api_key=api_key,
        model_name=os.getenv("MODEL", "hf:moonshotai/Kimi-K2.5"),
        base_url=os.getenv("BASE_URL", "https://api.synthetic.new/openai/v1"),
        topic="The history of space exploration",
    )


async def run_langchain_workflow(
    config: LangchainWorkflowConfig | None = None,
) -> dict[str, str]:
    workflow_config: LangchainWorkflowConfig = config or resolve_langchain_config()

    model: ChatOpenAI = ChatOpenAI(
        model=workflow_config.model_name,
        temperature=0.2,
        api_key=workflow_config.api_key,
        base_url=workflow_config.base_url,
    )
    parser: StrOutputParser = StrOutputParser()

    summary_chain: Runnable[Any, str] = (
        ChatPromptTemplate.from_messages(
            [
                ("system", "Summarize the following topic concisely:"),
                ("user", "{topic}"),
            ]
        )
        | model
        | parser
    )
    questions_chain: Runnable[Any, str] = (
        ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "Generate three interesting questions about the following topic:",
                ),
                ("user", "{topic}"),
            ]
        )
        | model
        | parser
    )
    terms_chain: Runnable[Any, str] = (
        ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "Identify 5-10 key terms from the following topic, separated by commas:",
                ),
                ("user", "{topic}"),
            ]
        )
        | model
        | parser
    )

    parallel_chain: RunnableParallel = RunnableParallel(
        {
            "summary": summary_chain,
            "questions": questions_chain,
            "key_terms": terms_chain,
        }
    )
    parallel_result: dict[str, str] = await parallel_chain.ainvoke(
        {"topic": workflow_config.topic}
    )

    synthesis_chain: Runnable[Any, str] = (
        ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "Based on the following information:\n"
                    "Summary: {summary}\n"
                    "Related Questions: {questions}\n"
                    "Key Terms: {key_terms}\n"
                    "Synthesize a comprehensive answer.",
                ),
                (
                    "user",
                    "Original topic: {topic}",
                ),
            ]
        )
        | model
        | parser
    )

    synthesis_input: dict[str, str] = {
        "summary": parallel_result["summary"],
        "questions": parallel_result["questions"],
        "key_terms": parallel_result["key_terms"],
        "topic": workflow_config.topic,
    }
    final_response: str = await synthesis_chain.ainvoke(synthesis_input)

    return {
        "topic": workflow_config.topic,
        "summary": parallel_result["summary"],
        "questions": parallel_result["questions"],
        "key_terms": parallel_result["key_terms"],
        "final_response": final_response,
    }


async def _main() -> None:
    result: dict[str, str] = await run_langchain_workflow()
    print(json.dumps(result, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    asyncio.run(_main())
