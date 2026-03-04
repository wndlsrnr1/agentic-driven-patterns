import os

from dotenv import load_dotenv
from google.adk.agents import LlmAgent, SequentialAgent
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

# The first agent generates the initial draft.
generator = LlmAgent(
    name="DraftWriter",
    description="Generates initial draft content on a given subject.",
    instruction="Write a short, informative paragraph about the user's subject.",
    output_key="draft_text",  # The output is saved to this state key.
)

# The second agent critiques the draft from the first agent.
reviewer = LlmAgent(
    name="FactChecker",
    description="Reviews a given text for factual accuracy and provides a structured critique.",
    instruction="""
You are a meticulous fact-checker.
1. Read the text provided in the state key 'draft_text'.
2. Carefully verify the factual accuracy of all claims.
3. Your final output must be a dictionary containing two keys:
- "status": A string, either "ACCURATE" or "INACCURATE".
- "reasoning": A string providing a clear explanation for your status,
  citing specific issues if any are found.
""",
    output_key="review_output",  # The structured dictionary is saved here.
)

# The SequentialAgent ensures the generator runs before the reviewer.
review_pipeline = SequentialAgent(
    name="WriteAndReview_Pipeline",
    sub_agents=[generator, reviewer],
)

# Execution Flow:
# 1. generator runs -> saves its paragraph to state['draft_text'].
# 2. reviewer runs -> reads state['draft_text'] and saves its dictionary
#    output to state['review_output'].


def run_reflection_loop() -> None:
    load_dotenv()

    if not os.getenv("OPENAI_API_KEY"):
        raise ValueError("OPENAI_API_KEY not found in .env file. Please add it.")

    llm = ChatOpenAI(model="gpt-4o", temperature=0.1)
    task_prompt = "Write a Python function named calculate_factorial."
    current_code = "def calculate_factorial(n):\n    pass"
    message_history = []

    for _ in range(1):
        reflector_prompt = [
            SystemMessage(
                content="""
You are a senior software engineer and an expert
in Python.
Your role is to perform a meticulous code review.
Critically evaluate the provided Python code based
on the original task requirements.
Look for bugs, style issues, missing edge cases,
and areas for improvement.
If the code is perfect and meets all requirements,
respond with the single phrase 'CODE_IS_PERFECT'.
Otherwise, provide a bulleted list of your critiques.
"""
            ),
            HumanMessage(content=f"Original Task:\n{task_prompt}\n\nCode to Review:\n{current_code}"),
        ]
        critique_response = llm.invoke(reflector_prompt)
        critique = critique_response.content
        # --- 3. STOPPING CONDITION ---
        if "CODE_IS_PERFECT" in critique:
            print("\n--- Critique ---\nNo further critiques found. The code is satisfactory.")
            break
        print("\n--- Critique ---\n" + critique)
        # Add the critique to the history for the next refinement loop.
        message_history.append(HumanMessage(content=f"Critique of the previous code:\n{critique}"))

    print("\n" + "=" * 30 + " FINAL RESULT " + "=" * 30)
    print("\nFinal refined code after the reflection process:\n")
    print(current_code)


if __name__ == "__main__":
    run_reflection_loop()
