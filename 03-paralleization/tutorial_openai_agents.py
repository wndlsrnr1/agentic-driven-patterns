import asyncio
import json
import os
from dataclasses import dataclass
from typing import Any, Final

from tutorial_types import StepLogger, TutorialStepResult

STEP_ID: Final[str] = "step-3-openai-agents"
LIBRARY: Final[str] = "openai-agents"


@dataclass(frozen=True)
class OpenAiTutorialConfig:
    api_key: str
    model_name: str
    base_url: str | None


def resolve_openai_tutorial_config() -> OpenAiTutorialConfig | None:
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "").strip()
    if openai_api_key:
        return OpenAiTutorialConfig(
            api_key=openai_api_key,
            model_name="gpt-4o-mini",
            base_url=None,
        )

    API_KEY: str = os.getenv("API_KEY", "").strip()
    if API_KEY:
        return OpenAiTutorialConfig(
            api_key=API_KEY,
            model_name="hf:moonshotai/Kimi-K2.5",
            base_url="https://api.synthetic.new/openai/v1",
        )

    return None


async def run_openai_agents_tutorial(log: StepLogger = print) -> TutorialStepResult:
    config: OpenAiTutorialConfig | None = resolve_openai_tutorial_config()
    if config is None:
        return TutorialStepResult(
            step_id=STEP_ID,
            library=LIBRARY,
            status="skipped",
            message="OPENAI_API_KEY or API_KEY is missing.",
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
            library=LIBRARY,
            status="skipped",
            message=(
                "openai-agents package is not available. "
                f"Install requirement first. detail={exception}"
            ),
        )

    log("[openai-agents] STEP 1/3 setup")
    set_default_openai_key(config.api_key)
    set_default_openai_api("chat_completions")

    provider: OpenAIProvider = OpenAIProvider(
        api_key=config.api_key,
        base_url=config.base_url,
        use_responses=False,
    )
    run_config: RunConfig = RunConfig(model_provider=provider)

    biology_agent: Agent = Agent(
        name="BiologyExpert",
        model=config.model_name,
        instructions="You are a biology expert. Summarize CRISPR in one sentence.",
    )
    chemistry_agent: Agent = Agent(
        name="ChemistryExpert",
        model=config.model_name,
        instructions=(
            "You are a chemistry expert. "
            "Summarize solid-state batteries in one sentence."
        ),
    )

    log("[openai-agents] STEP 2/3 run")
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
                "biology": biology_output
                if isinstance(biology_output, str)
                else json.dumps(biology_output, ensure_ascii=True, indent=2),
                "chemistry": chemistry_output
                if isinstance(chemistry_output, str)
                else json.dumps(chemistry_output, ensure_ascii=True, indent=2),
            },
            ensure_ascii=True,
            indent=2,
        )

        return TutorialStepResult(
            step_id=STEP_ID,
            library=LIBRARY,
            status="completed",
            message="OpenAI Agents tutorial completed.",
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
    result: TutorialStepResult = await run_openai_agents_tutorial()
    print(json.dumps(result.__dict__, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    asyncio.run(_main())
