import asyncio
import os
from operator import itemgetter
from typing import Any, Final, Optional

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable, RunnableParallel
from langchain_openai import ChatOpenAI

MODEL_NAME: Final[str] = "gpt-4o-mini"
MODEL_TEMPERATURE: Final[float] = 0.7
DEFAULT_TOPIC: Final[str] = "The history of space exploration"


def create_llm() -> Optional[ChatOpenAI]:
    api_key: Optional[str] = os.getenv("OPENAI_API_KEY")
    if api_key is None or api_key.strip() == "":
        print("OPENAI_API_KEY is not set. Cannot run LangChain parallel example.")
        return None

    try:
        llm: ChatOpenAI = ChatOpenAI(
            model=MODEL_NAME,
            temperature=MODEL_TEMPERATURE,
        )
        return llm
    except Exception as exception:  # noqa: BLE001
        print(f"Error initializing language model: {exception}")
        return None


def build_parallel_chain(llm: ChatOpenAI) -> Runnable[Any, str]:
    summarize_chain: Runnable[Any, str] = (
        ChatPromptTemplate.from_messages(
            [
                ("system", "Summarize the following topic concisely:"),
                ("user", "{topic}"),
            ]
        )
        | llm
        | StrOutputParser()
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
        | llm
        | StrOutputParser()
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
        | llm
        | StrOutputParser()
    )

    map_chain: RunnableParallel = RunnableParallel(
        {
            "summary": summarize_chain,
            "questions": questions_chain,
            "key_terms": terms_chain,
            "topic": itemgetter("topic"),
        }
    )

    synthesis_prompt: ChatPromptTemplate = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "Based on the following information:\n"
                    "Summary: {summary}\n"
                    "Related Questions: {questions}\n"
                    "Key Terms: {key_terms}\n"
                    "Synthesize a comprehensive answer."
                ),
            ),
            ("user", "Original topic: {topic}"),
        ]
    )

    full_parallel_chain: Runnable[Any, str] = (
        map_chain | synthesis_prompt | llm | StrOutputParser()
    )
    return full_parallel_chain


async def run_parallel_example(topic: str) -> None:
    llm: Optional[ChatOpenAI] = create_llm()
    if llm is None:
        return

    full_parallel_chain: Runnable[Any, str] = build_parallel_chain(llm)
    print(f"\n--- Running Parallel LangChain Example for Topic: '{topic}' ---")

    try:
        response: str = await full_parallel_chain.ainvoke({"topic": topic})
        print("\n--- Final Response ---")
        print(response)
    except Exception as exception:  # noqa: BLE001
        print(f"\nAn error occurred during chain execution: {exception}")


if __name__ == "__main__":
    asyncio.run(run_parallel_example(DEFAULT_TOPIC))
