from typing import Final

from google.adk.agents import LlmAgent, ParallelAgent, SequentialAgent
from google.adk.tools import google_search

GEMINI_MODEL: Final[str] = "gemini-2.0-flash"


def create_researcher_agent(
    name: str,
    topic: str,
    specialization: str,
    description: str,
    output_key: str,
) -> LlmAgent:
    instruction: str = (
        f"You are an AI Research Assistant specializing in {specialization}.\n"
        f"Research the latest advancements in '{topic}'.\n"
        "Use the Google Search tool provided.\n"
        "Summarize your key findings concisely (1-2 sentences).\n"
        "Output *only* the summary.\n"
    )

    return LlmAgent(
        name=name,
        model=GEMINI_MODEL,
        instruction=instruction,
        description=description,
        tools=[google_search],
        output_key=output_key,
    )


researcher_agent_1: LlmAgent = create_researcher_agent(
    name="RenewableEnergyResearcher",
    topic="renewable energy sources",
    specialization="energy",
    description="Researches renewable energy sources.",
    output_key="renewable_energy_result",
)

researcher_agent_2: LlmAgent = create_researcher_agent(
    name="EVResearcher",
    topic="electric vehicle technology",
    specialization="transportation",
    description="Researches electric vehicle technology.",
    output_key="ev_technology_result",
)

researcher_agent_3: LlmAgent = create_researcher_agent(
    name="CarbonCaptureResearcher",
    topic="carbon capture methods",
    specialization="climate solutions",
    description="Researches carbon capture methods.",
    output_key="carbon_capture_result",
)

parallel_research_agent: ParallelAgent = ParallelAgent(
    name="ParallelWebResearchAgent",
    sub_agents=[researcher_agent_1, researcher_agent_2, researcher_agent_3],
    description="Runs multiple research agents in parallel to gather information.",
)

merger_instruction: str = """
You are an AI Assistant responsible for combining research findings into a structured report.
Your primary task is to synthesize the following research summaries, clearly attributing findings to their source areas.
Structure your response using headings for each topic.
Ensure the report is coherent and integrates the key points smoothly.

Crucially: Your entire response MUST be grounded exclusively on the information provided in the Input Summaries below.
Do NOT add any external knowledge, facts, or details not present in these specific summaries.

Input Summaries:
- Renewable Energy:
{renewable_energy_result}
- Electric Vehicles:
{ev_technology_result}
- Carbon Capture:
{carbon_capture_result}

Output Format:
## Summary of Recent Sustainable Technology Advancements
### Renewable Energy Findings
(Based on RenewableEnergyResearcher's findings)
[Synthesize and elaborate only on the renewable energy input summary provided above.]
### Electric Vehicle Findings
(Based on EVResearcher's findings)
[Synthesize and elaborate only on the EV input summary provided above.]
### Carbon Capture Findings
(Based on CarbonCaptureResearcher's findings)
[Synthesize and elaborate only on the carbon capture input summary provided above.]
### Overall Conclusion
[Provide a brief (1-2 sentence) concluding statement that connects only the findings presented above.]

Output only the structured report following this format.
Do not include introductory or concluding phrases outside this structure.
"""

merger_agent: LlmAgent = LlmAgent(
    name="SynthesisAgent",
    model=GEMINI_MODEL,
    instruction=merger_instruction,
    description=(
        "Combines research findings from parallel agents into a structured report "
        "that is grounded only on the provided input summaries."
    ),
)

sequential_pipeline_agent: SequentialAgent = SequentialAgent(
    name="ResearchAndSynthesisPipeline",
    sub_agents=[parallel_research_agent, merger_agent],
    description="Coordinates parallel research and synthesizes the results.",
)

root_agent: SequentialAgent = sequential_pipeline_agent
