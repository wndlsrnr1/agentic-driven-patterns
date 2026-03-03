from dataclasses import dataclass
from typing import Awaitable, Callable, Literal, Optional

TutorialLibrary = Literal["google-adk", "langchain", "openai-agents"]
TutorialStepStatus = Literal["completed", "skipped", "failed"]
StepLogger = Callable[[str], None]


@dataclass(frozen=True)
class TutorialStepResult:
    step_id: str
    library: TutorialLibrary
    status: TutorialStepStatus
    message: str
    output: Optional[str] = None


@dataclass(frozen=True)
class RunTutorialResult:
    steps: list[TutorialStepResult]
    started_at_iso: str
    completed_at_iso: str


StepRunner = Callable[[StepLogger], Awaitable[TutorialStepResult]]
