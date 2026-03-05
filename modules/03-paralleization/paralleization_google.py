import asyncio
import json
import os
from dataclasses import dataclass
from typing import Any

from google.adk.agents import LlmAgent, ParallelAgent, SequentialAgent
from google.adk.tools import google_search


@dataclass(frozen=True)
class GoogleWorkflowConfig:
    api_key: str
    model_name: str
    topic: str


def resolve_google_config() -> GoogleWorkflowConfig:
    api_key: str = (
        os.getenv("GEMINI_API_KEY", "").strip()
        or os.getenv("GOOGLE_API_KEY", "").strip()
        or os.getenv("API_KEY", "").strip()
    )
    if api_key == "":
        raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY or API_KEY is missing.")

    return GoogleWorkflowConfig(
        api_key=api_key,
        model_name=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
        topic="sustainable technology advancements",
    )


async def run_google_workflow(config: GoogleWorkflowConfig | None = None) -> dict[str, Any]:
    workflow_config: GoogleWorkflowConfig = config or resolve_google_config()
    os.environ["GOOGLE_API_KEY"] = workflow_config.api_key

    renewable_agent: LlmAgent = LlmAgent(
        name="RenewableEnergyResearcher",
        model=workflow_config.model_name,
        instruction=(
            "You are an AI Research Assistant specializing in energy.\n"
            "Research the latest advancements in 'renewable energy sources'.\n"
            "Use the Google Search tool provided.\n"
            "Summarize your key findings concisely (1-2 sentences).\n"
            "Output *only* the summary.\n"
        ),
        tools=[google_search],
    )
    ev_agent: LlmAgent = LlmAgent(
        name="EVResearcher",
        model=workflow_config.model_name,
        instruction=(
            "You are an AI Research Assistant specializing in transportation.\n"
            "Research the latest advancements in 'electric vehicle technology'.\n"
            "Use the Google Search tool provided.\n"
            "Summarize your key findings concisely (1-2 sentences).\n"
            "Output *only* the summary.\n"
        ),
        tools=[google_search],
    )
    carbon_capture_agent: LlmAgent = LlmAgent(
        name="CarbonCaptureResearcher",
        model=workflow_config.model_name,
        instruction=(
            "You are an AI Research Assistant specializing in climate solutions.\n"
            "Research the latest advancements in 'carbon capture methods'.\n"
            "Use the Google Search tool provided.\n"
            "Summarize your key findings concisely (1-2 sentences).\n"
            "Output *only* the summary.\n"
        ),
        tools=[google_search],
    )

    parallel_agent: ParallelAgent = ParallelAgent(
        name="ParallelWebResearchAgent",
        sub_agents=[renewable_agent, ev_agent, carbon_capture_agent],
    )
    synthesis_agent: LlmAgent = LlmAgent(
        name="SynthesisAgent",
        model=workflow_config.model_name,
        instruction=(
            "You are an AI Assistant responsible for combining research findings into a structured report.\n"
            "Your primary task is to synthesize the following research summaries, clearly attributing findings to their source areas.\n"
            "Structure your response using headings for each topic.\n"
            "Ensure the report is coherent and integrates the key points smoothly.\n\n"
            "Crucially: Your entire response MUST be grounded exclusively on the information provided in the Input Summaries below.\n"
            "Do NOT add any external knowledge, facts, or details not present in these specific summaries.\n\n"
            "Input Summaries:\n"
            "- Renewable Energy:\n"
            "{renewable_energy_result}\n"
            "- Electric Vehicles:\n"
            "{ev_technology_result}\n"
            "- Carbon Capture:\n"
            "{carbon_capture_result}\n\n"
            "Output Format:\n"
            "## Summary of Recent Sustainable Technology Advancements\n"
            "### Renewable Energy Findings\n"
            "(Based on RenewableEnergyResearcher's findings)\n"
            "[Synthesize and elaborate only on the renewable energy input summary provided above.]\n"
            "### Electric Vehicle Findings\n"
            "(Based on EVResearcher's findings)\n"
            "[Synthesize and elaborate only on the EV input summary provided above.]\n"
            "### Carbon Capture Findings\n"
            "(Based on CarbonCaptureResearcher's findings)\n"
            "[Synthesize and elaborate only on the carbon capture input summary provided above.]\n"
            "### Overall Conclusion\n"
            "[Provide a brief (1-2 sentence) concluding statement that connects only the findings presented above.]\n\n"
            "Output only the structured report following this format.\n"
            "Do not include introductory or concluding phrases outside this structure."
        ),
    )
    root_agent: SequentialAgent = SequentialAgent(
        name="ResearchAndSynthesisPipeline",
        sub_agents=[parallel_agent, synthesis_agent],
    )

    try:
        from google.adk.agents import InvocationContext

        context: InvocationContext = InvocationContext()
        events: list[str] = []
        async for event in root_agent.run_async(context):
            events.append(str(event))

        report: str = "\n".join(events[-5:]) if events else "No output from workflow."
        return {
            "report": report,
            "model_name": workflow_config.model_name,
            "topic": workflow_config.topic,
        }
    except Exception as exception:  # noqa: BLE001
        return {
            "report": "",
            "model_name": workflow_config.model_name,
            "topic": workflow_config.topic,
            "error": str(exception),
        }


async def _main() -> None:
    result: dict[str, Any] = await run_google_workflow()
    print(json.dumps(result, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    asyncio.run(_main())
