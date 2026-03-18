import asyncio
import json
from datetime import datetime, timezone

from tutorial_types import RunTutorialResult, TutorialStepResult
from tutorial_google_adk import run_google_adk_tutorial
from tutorial_langchain import run_langchain_tutorial
from tutorial_openai_agents import run_openai_agents_tutorial


async def run_library_tutorial() -> RunTutorialResult:
    started_at: datetime = datetime.now(timezone.utc)

    google_step: TutorialStepResult = await run_google_adk_tutorial()
    langchain_step: TutorialStepResult = await run_langchain_tutorial()
    openai_step: TutorialStepResult = await run_openai_agents_tutorial()

    completed_at: datetime = datetime.now(timezone.utc)
    result: RunTutorialResult = RunTutorialResult(
        steps=[google_step, langchain_step, openai_step],
        started_at_iso=started_at.isoformat(),
        completed_at_iso=completed_at.isoformat(),
    )
    return result


async def _main() -> None:
    result: RunTutorialResult = await run_library_tutorial()
    print(json.dumps(result.__dict__, default=lambda value: value.__dict__, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    asyncio.run(_main())
