import asyncio
import json
import os
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class OpenAiWorkflowConfig:
    api_key: str
    model_name: str
    base_url: str


def resolve_openai_config() -> OpenAiWorkflowConfig:
    api_key: str = os.getenv("SYNTHETIC_API_KEY", "").strip()
    if api_key == "":
        raise ValueError("SYNTHETIC_API_KEY is missing.")

    return OpenAiWorkflowConfig(
        api_key=api_key,
        model_name=os.getenv("SYNTHETIC_MODEL", "hf:moonshotai/Kimi-K2.5"),
        base_url=os.getenv("SYNTHETIC_BASE_URL", "https://api.synthetic.new/openai/v1"),
    )


async def run_openai_workflow(
    config: OpenAiWorkflowConfig | None = None,
) -> dict[str, Any]:
    workflow_config: OpenAiWorkflowConfig = config or resolve_openai_config()

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
        return {
            "summaries": [],
            "merged_report": "",
            "model_name": workflow_config.model_name,
            "error": f"openai-agents package is unavailable: {exception}",
        }

    set_default_openai_key(workflow_config.api_key)
    set_default_openai_api("chat_completions")

    provider: OpenAIProvider = OpenAIProvider(
        api_key=workflow_config.api_key,
        base_url=workflow_config.base_url,
        use_responses=False,
    )
    run_config: RunConfig = RunConfig(model_provider=provider)

    topics: list[tuple[str, str]] = [
        ("RenewableEnergyResearcher", "renewable energy sources"),
        ("EVResearcher", "electric vehicle technology"),
        ("CarbonCaptureResearcher", "carbon capture methods"),
    ]

    agents: list[Agent] = []
    tasks: list[asyncio.Task[Any]] = []
    for name, topic in topics:
        agent: Agent = Agent(
            name=name,
            model=workflow_config.model_name,
            instructions=f"Research {topic}. Return a concise 1-2 sentence summary.",
        )
        agents.append(agent)
        task: asyncio.Task[Any] = asyncio.create_task(
            Runner.run(
                agent,
                f"Topic: {topic}",
                max_turns=6,
                run_config=run_config,
            )
        )
        tasks.append(task)

    raw_results: list[Any] = await asyncio.gather(*tasks)
    summaries: list[dict[str, str]] = []
    for index, raw_result in enumerate(raw_results):
        output: Any = raw_result.final_output
        topic: str = topics[index][1]
        summary: str = output if isinstance(output, str) else json.dumps(output)
        summaries.append({"topic": topic, "summary": summary})

    synthesis_agent: Agent = Agent(
        name="SynthesisAgent",
        model=workflow_config.model_name,
        instructions="Combine the summaries into one structured markdown report.",
    )
    synthesis_input: str = "\n".join(
        [
            "Input Summaries:",
            *[f"{item['topic']}: {item['summary']}" for item in summaries],
        ]
    )

    synthesis_result: Any = await Runner.run(
        synthesis_agent,
        synthesis_input,
        max_turns=8,
        run_config=run_config,
    )
    merged_output: Any = synthesis_result.final_output
    merged_report: str = (
        merged_output if isinstance(merged_output, str) else json.dumps(merged_output)
    )

    return {
        "summaries": summaries,
        "merged_report": merged_report,
        "model_name": workflow_config.model_name,
    }


async def _main() -> None:
    result: dict[str, Any] = await run_openai_workflow()
    print(json.dumps(result, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    asyncio.run(_main())
