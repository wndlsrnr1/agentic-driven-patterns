import asyncio

import nest_asyncio
from google.adk.agents import LlmAgent
from google.adk.code_executors import BuiltInCodeExecutor
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import google_search
from google.genai import types

# Define variables required for Session setup and Agent execution
APP_NAME = "calculator"
USER_ID = "user1234"
SESSION_ID = "session_code_exec_async"

# Agent Definition
code_agent = LlmAgent(
    name="calculator_agent",
    model="gemini-2.0-flash",
    code_executor=BuiltInCodeExecutor(),
    instruction=(
        "You are a calculator agent.\n"
        "When given a mathematical expression, write and execute Python code\n"
        "to calculate the result.\n"
        "Return only the final numerical result as plain text, without markdown or code blocks."
    ),
    description="Executes Python code to perform calculations.",
)


# Agent Interaction (Async)
async def call_agent_async(query: str) -> None:
    """Send a query to the calculator agent and print structured event output."""

    # Session and Runner
    session_service = InMemorySessionService()
    await session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID)
    runner = Runner(agent=code_agent, app_name=APP_NAME, session_service=session_service)
    content = types.Content(role="user", parts=[types.Part(text=query)])

    print(f"\n--- Running Query: {query} ---")
    final_response_text = "No final text response captured."
    try:
        # Use run_async
        async for event in runner.run_async(user_id=USER_ID, session_id=SESSION_ID, new_message=content):
            print(f"Event ID: {event.id}, Author: {event.author}")

            if not event.content or not event.content.parts:
                continue

            # Check for specific parts FIRST
            for part in event.content.parts:
                if part.executable_code:
                    print(
                        f" Debug: Agent generated code:\n```python\n{part.executable_code.code}\n```"
                    )
                elif part.code_execution_result:
                    print(
                        f" Debug: Code Execution Result: {part.code_execution_result.outcome} -\n"
                        f"Output:\n{part.code_execution_result.output}"
                    )
                elif part.text and not part.text.isspace():
                    print(f" Text: '{part.text.strip()}'")

            # Also capture final response text.
            if event.is_final_response():
                text_parts = [part.text for part in event.content.parts if part.text]
                if text_parts:
                    final_response_text = "".join(text_parts).strip()

    except Exception as error:
        print(f"ERROR during agent run: {error}")

    print(f"==> Final Agent Response: {final_response_text}")
    print("-" * 30)


# Main async function to run the examples
async def main() -> None:
    await call_agent_async("Calculate the value of (5 + 7) * 3")
    await call_agent_async("What is 10 factorial?")


if __name__ == "__main__":
    try:
        nest_asyncio.apply()
        asyncio.run(main())
    except RuntimeError as error:
        # Handle specific error when running asyncio.run in an already running loop (like Jupyter/Colab)
        if "cannot be called from a running event loop" in str(error):
            print("\nRunning in an existing event loop (like Colab/Jupyter).")
            print("Please run `await main()` in a notebook cell instead.")
        else:
            raise error
