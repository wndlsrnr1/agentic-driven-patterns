"""
libarary-tutorial.py

학습 목표:
1) Google ADK 및 GenAI의 핵심 컴포넌트 10가지(Python 매핑)를 이해합니다.
2) ParallelAgent를 이용한 병렬 워크플로우를 구축합니다.
3) SequentialAgent를 통한 후속 합성 파이프라인을 구축합니다.

--- 10가지 핵심 컴포넌트 매핑 가이드 ---
1. Gemini: Python ADK에서는 프레임워크가 내부적으로 관리하므로 생성자(model=GEMINI_MODEL_NAME)에 문자열을 전달하여 대체합니다.
2. InMemoryRunner: 워크플로우 로컬 실행/세션 관리를 위한 러너입니다. (google.adk.runners.InMemoryRunner)
3. LlmAgent: 단일 역할 수행을 지시받는 기본 에이전트 클래스입니다. (google.adk.agents.LlmAgent)
4. ParallelAgent: 여러 에이전트를 동시에 실행하여 결과를 합칩니다. (google.adk.agents.ParallelAgent)
5. SequentialAgent: 에이전트를 순차적으로 체이닝합니다. (google.adk.agents.SequentialAgent)
6. isFinalResponse: 이벤트가 완성된 최종 형태인지 식별합니다. (Event.is_final_response() 메서드로 사용)
7. stringifyContent: 이벤트의 텍스트 결과를 추출합니다. (Python에서는 .text 속성 등으로 추출)
8. Event: 에이전트 및 유저 간의 메시지 흐름 단위 객체입니다. (google.adk.events.Event)
9. Content: 텍스트, 멀티모달 프롬프트를 담는 GenAI 타입입니다. (google.genai.types.Content)
10. createUserContent: 유저 발화를 Content 객체로 매핑하는 헬퍼입니다. (Python 함수 구현 활용)
"""

import asyncio
import json
import os
import uuid
from typing import Final, Any, AsyncGenerator, Optional

# 1. 컴포넌트 임포트 (Python ADK 매핑)
# (3, 4, 5) 에이전트 구성 요소
from google.adk.agents import LlmAgent, ParallelAgent, SequentialAgent
# (8) 이벤트 객체
from google.adk.events import Event
# (2) 로컬 세션 러너
from google.adk.runners import InMemoryRunner
# (9) 제너레이티브 AI 프롬프트 타입
from google.genai.types import Content, Part

from tutorial_types import StepLogger, TutorialStepResult

STEP_ID: Final[str] = "step-1-google-adk-library"
LIBRARY: Final[str] = "google-adk"

# (1) Gemini 클라이언트 객체 생성 대신 모델명 할당
GEMINI_MODEL_NAME: Final[str] = "gemini-2.0-flash"

TUTORIAL_TOPIC: Final[str] = "Artificial Intelligence in Healthcare"
APP_NAME: Final[str] = "parallelization-tutorial-adk-python"
USER_ID: Final[str] = "parallelization-tutorial-user"


def _log_step(log: StepLogger, step_number: int, title: str) -> None:
    """공통 STEP 로그 포맷."""
    log(f"[google-adk] STEP {step_number}/3 {title}")


def _resolve_api_key() -> str | None:
    """비밀키 입력 경로 최소화: GEMINI -> GOOGLE 순으로 확인."""
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_api_key:
        return gemini_api_key

    google_api_key: str = os.getenv("GOOGLE_API_KEY", "").strip()
    if google_api_key:
        return google_api_key

    return None


# (10) createUserContent 헬퍼 파이썬 구현
def create_user_content(text: str) -> Content:
    """텍스트 형태의 질문을 제너레이티브 AI Content 타입으로 래핑합니다."""
    return Content(role="user", parts=[Part(text=text)])


# (7) stringifyContent 헬퍼 기능 파이썬 구현
def stringify_content(event: Event) -> str:
    """Event 등에서 텍스트 기반 응답을 문자열로 추출합니다."""
    # Python ADK에선 Event에 .text 프로퍼티를 제공합니다.
    return getattr(event, "text", "") or ""


def extract_adk_text_output(events: list[Event]) -> str | None:
    """응답 스트림 중 최종(Final) 응답에서 텍스트를 파싱하여 병합합니다."""
    # 역순 탐색으로 마지막 응답 우선 파악
    for event in reversed(events):
        # (6) isFinalResponse -> event.is_final_response() 매핑
        if event.is_final_response():
            text: str = stringify_content(event).strip()
            if text:
                return text

    # 폴백: 일반 응답 텍스트 결합
    for event in reversed(events):
        text: str = stringify_content(event).strip()
        if text:
            return text
    return None


async def run_tutorial(log: StepLogger = print) -> TutorialStepResult:
    """기본 튜토리얼 구현부"""
    
    # Step 1) 실행 준비: 필수 키 확인
    _log_step(log, 1, "setup")
    api_key: str | None = _resolve_api_key()
    if not api_key:
        return TutorialStepResult(
            step_id=STEP_ID,
            library=LIBRARY,
            status="skipped",
            message="GEMINI_API_KEY or GOOGLE_API_KEY is missing."
        )
    os.environ["GEMINI_API_KEY"] = api_key

    # Step 2) 병렬 파이프라인 조립
    _log_step(log, 2, "build parallel workflow")

    # (3) LlmAgent 인스턴스: 기술 파트
    tech_researcher: LlmAgent = LlmAgent(
        name="TechResearcher",
        model=GEMINI_MODEL_NAME,
        instruction=f"Research the technology advances of the topic.\nSummarize in exactly one sentence.\nTopic: {TUTORIAL_TOPIC}",
    )

    # (3) LlmAgent 인스턴스: 시장 파트
    market_researcher: LlmAgent = LlmAgent(
        name="MarketResearcher",
        model=GEMINI_MODEL_NAME,
        instruction=f"Research the market impact of the topic.\nSummarize in exactly one sentence.\nTopic: {TUTORIAL_TOPIC}",
    )

    # (4) ParallelAgent: 두 작업을 병렬로 수행하는 에이전트 블록
    parallel_researcher: ParallelAgent = ParallelAgent(
        name="ParallelResearchers",
        sub_agents=[tech_researcher, market_researcher],
    )

    # (3) LlmAgent 인스턴스: 취합 파트
    synthesis_agent: LlmAgent = LlmAgent(
        name="SynthesisAgent",
        model=GEMINI_MODEL_NAME,
        instruction="Combine the previous summaries into a concise markdown report. Do not add external knowledge.",
    )

    # (5) SequentialAgent: 병렬 조사 후 합성을 순차적으로 이어주는 중앙 에이전트
    workflow: SequentialAgent = SequentialAgent(
        name="AdkParallelTutorialWorkflow",
        sub_agents=[parallel_researcher, synthesis_agent],
    )

    # Step 3) 실행 및 메모리 관리기능 통한 제어
    _log_step(log, 3, "execute and collect output")
    
    # (2) InMemoryRunner: 워크플로우를 직접 실행하고 세션을 관리합니다.
    runner: InMemoryRunner = InMemoryRunner(
        agent=workflow,
        app_name=APP_NAME
    )
    
    session_id: str = str(uuid.uuid4())

    # (9 & 10) 질의를 생성합니다.
    user_message: Content = create_user_content(f"Create a short report for: {TUTORIAL_TOPIC}")
    events: list[Event] = []

    try:
        # 비동기로 스트리밍 응답 캡처
        async for event in runner.run_async(
            user_id=USER_ID,
            session_id=session_id,
            new_message=user_message,
        ):
            events.append(event)
        
        output_str: str | None = extract_adk_text_output(events)
        if output_str:
            return TutorialStepResult(
                step_id=STEP_ID,
                library=LIBRARY,
                status="completed",
                message="Google ADK Python tutorial completed.",
                output=output_str
            )
        else:
            return TutorialStepResult(
                step_id=STEP_ID,
                library=LIBRARY,
                status="failed",
                message="Google ADK tutorial failed: no text output."
            )
            
    except Exception as e:
        return TutorialStepResult(
            step_id=STEP_ID,
            library=LIBRARY,
            status="failed",
            message=f"Google ADK tutorial failed: {e}",
        )


async def _main() -> None:
    result: TutorialStepResult = await run_tutorial()
    print(json.dumps(result.__dict__, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    asyncio.run(_main())
