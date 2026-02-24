"""
tutorial_types.py

튜토리얼 전 파일에서 공유하는 타입 계약 모음입니다.
- 실행 결과 구조(TutorialStepResult, RunTutorialResult)
- 실행 함수 시그니처(StepRunner, StepLogger)
"""

from dataclasses import dataclass
from typing import Awaitable, Callable, Literal, Optional

TutorialLibrary = Literal["google-adk", "langchain", "openai-agents"]
TutorialStepStatus = Literal["completed", "skipped", "failed"]
StepLogger = Callable[[str], None]


@dataclass(frozen=True)
class TutorialStepResult:
    """개별 tutorial step 실행 결과."""

    step_id: str
    library: TutorialLibrary
    status: TutorialStepStatus
    message: str
    output: Optional[str] = None


@dataclass(frozen=True)
class RunTutorialResult:
    """전체 tutorial 실행 결과."""

    steps: list[TutorialStepResult]
    started_at_iso: str
    completed_at_iso: str


StepRunner = Callable[[StepLogger], Awaitable[TutorialStepResult]]
