# Copyright (c) 2025 Marco Fago
# https://www.linkedin.com/in/marco-fago/
#
# This code is licensed under the MIT License.
# See the LICENSE file in the repository for the full license text.

from __future__ import annotations

from typing import Any

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableBranch, RunnablePassthrough
from langchain_google_genai import ChatGoogleGenerativeAI


def create_llm() -> ChatGoogleGenerativeAI | None:
    """Initialize the Google GenAI chat model or return None on failure."""
    try:
        llm: ChatGoogleGenerativeAI = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0,
        )
        print(f"Language model initialized: {llm.model}")
        return llm
    except Exception as error:  # noqa: BLE001
        print(f"Error initializing language model: {error}")
        return None


def booking_handler(request: str) -> str:
    """Simulates the Booking Agent handling a request."""
    print("\n--- DELEGATING TO BOOKING HANDLER ---")
    return (
        f"Booking Handler processed request: '{request}'. "
        "Result: Simulated booking action."
    )


def info_handler(request: str) -> str:
    """Simulates the Info Agent handling a request."""
    print("\n--- DELEGATING TO INFO HANDLER ---")
    return (
        f"Info Handler processed request: '{request}'. "
        "Result: Simulated information retrieval."
    )


def unclear_handler(request: str) -> str:
    """Handles requests that couldn't be delegated."""
    print("\n--- HANDLING UNCLEAR REQUEST ---")
    return f"Coordinator could not delegate request: '{request}'. Please clarify."


def extract_request(payload: dict[str, Any]) -> str:
    """Extract the original user request from delegation payload."""
    request_block: dict[str, Any] = payload["request"]
    request_value: str = str(request_block["request"])
    return request_value


def decision_matches(payload: dict[str, Any], expected: str) -> bool:
    """Check whether router decision matches expected branch id."""
    decision: str = str(payload["decision"]).strip()
    return decision == expected


llm: ChatGoogleGenerativeAI | None = create_llm()

coordinator_router_prompt: ChatPromptTemplate = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """Analyze the user's request and determine which specialist handler should process it.
- If the request is related to booking flights or hotels, output 'booker'.
- For all other general information questions, output 'info'.
- If the request is unclear or doesn't fit either category, output 'unclear'.
ONLY output one word: 'booker', 'info', or 'unclear'.""",
        ),
        ("user", "{request}"),
    ]
)

coordinator_router_chain: Any | None = None
delegation_branch: RunnableBranch | None = None
coordinator_agent: Any | None = None

if llm is not None:
    coordinator_router_chain = coordinator_router_prompt | llm | StrOutputParser()

    branches: dict[str, Any] = {
        "booker": RunnablePassthrough.assign(
            output=lambda payload: booking_handler(extract_request(payload))
        ),
        "info": RunnablePassthrough.assign(
            output=lambda payload: info_handler(extract_request(payload))
        ),
        "unclear": RunnablePassthrough.assign(
            output=lambda payload: unclear_handler(extract_request(payload))
        ),
    }

    delegation_branch = RunnableBranch(
        (
            lambda payload: decision_matches(payload, "booker"),
            branches["booker"],
        ),
        (
            lambda payload: decision_matches(payload, "info"),
            branches["info"],
        ),
        branches["unclear"],
    )

    coordinator_agent = {
        "decision": coordinator_router_chain,
        "request": RunnablePassthrough(),
    } | delegation_branch | (lambda payload: payload["output"])


def main() -> None:
    """Run example requests through the coordinator agent."""
    if llm is None or coordinator_agent is None:
        print("\nSkipping execution due to LLM initialization failure.")
        return

    print("--- Running with a booking request ---")
    request_a: str = "Book me a flight to London."
    result_a: str = coordinator_agent.invoke({"request": request_a})
    print(f"Final Result A: {result_a}")

    print("\n--- Running with an info request ---")
    request_b: str = "What is the capital of Italy?"
    result_b: str = coordinator_agent.invoke({"request": request_b})
    print(f"Final Result B: {result_b}")

    print("\n--- Running with an unclear request ---")
    request_c: str = "Tell me about quantum physics."
    result_c: str = coordinator_agent.invoke({"request": request_c})
    print(f"Final Result C: {result_c}")


if __name__ == "__main__":
    main()
