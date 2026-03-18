import asyncio
import json
import os
from dataclasses import dataclass
from typing import Final

from google.adk.agents import LlmAgent, ParallelAgent, SequentialAgent
from google.adk.tools import google_search

from tutorial_types import StepLogger, TutorialStepResult

STEP_ID: Final[str] = "step-1-google-adk"
LIBRARY: Final[str] = "google-adk"


@dataclass(frozen=True)
class GoogleAdkConfig:
    api_key: str
    model_name: str
    topic: str


def resolve_google_adk_config() -> GoogleAdkConfig | None:
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_api_key:
        return GoogleAdkConfig(
            api_key=gemini_api_key,
            model_name=os.getenv("GOOGLE_MODEL", "gemini-2.0-flash"),
            topic="Artificial Intelligence in Healthcare",
        )

    google_api_key: str = os.getenv("GOOGLE_API_KEY", "").strip()
    if google_api_key:
        return GoogleAdkConfig(
            api_key=google_api_key,
            model_name=os.getenv("GOOGLE_MODEL", "gemini-2.0-flash"),
            topic="Artificial Intelligence in Healthcare",
        )

    return None


async def run_google_adk_tutorial(log: StepLogger = print) -> TutorialStepResult:
    config: GoogleAdkConfig | None = resolve_google_adk_config()
    if config is None:
        return TutorialStepResult(
            step_id=STEP_ID,
            library=LIBRARY,
            status="skipped",
            message="GEMINI_API_KEY or GOOGLE_API_KEY is missing.",
        )

    os.environ["GOOGLE_API_KEY"] = config.api_key
    log("[google-adk] STEP 1/3 setup")

    tech_agent: LlmAgent = LlmAgent(
        name="TechResearcher",
        model=config.model_name,
        instruction=(
            f"Research the technological advancements of '{config.topic}'. "
            "Summarize in one sentence."
        ),
        tools=[google_search],
    )
    market_agent: LlmAgent = LlmAgent(
        name="MarketResearcher",
        model=config.model_name,
        instruction=(
            f"Research the market impact of '{config.topic}'. "
            "Summarize in one sentence."
        ),
        tools=[google_search],
    )
    parallel_agent: ParallelAgent = ParallelAgent(
        name="ParallelWebResearch",
        sub_agents=[tech_agent, market_agent],
    )
    synthesis_agent: LlmAgent = LlmAgent(
        name="SynthesisAgent",
        model=config.model_name,
        instruction="Combine the parallel research summaries into a concise report.",
    )
    workflow: SequentialAgent = SequentialAgent(
        name="ResearchSynthesisPipeline",
        sub_agents=[parallel_agent, synthesis_agent],
    )

    log("[google-adk] STEP 2/3 run")
    try:
        from google.adk.agents import InvocationContext

        context: InvocationContext = InvocationContext()
        events: list[str] = []
        async for event in workflow.run_async(context):
            events.append(str(event))

        output: str = "\n".join(events[-5:]) if events else "No ADK events emitted."
        return TutorialStepResult(
            step_id=STEP_ID,
            library=LIBRARY,
            status="completed",
            message="Google ADK tutorial completed.",
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
    result: TutorialStepResult = await run_google_adk_tutorial()
    print(json.dumps(result.__dict__, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    asyncio.run(_main())
