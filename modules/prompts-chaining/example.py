"""LangChain LCEL 기반 prompts-chaining Python 예제 스크립트.

Context:
    호출자: `python3 modules/prompts-chaining/example.py` 형태의 수동 실행.
    사용 목적: 단일 입력 텍스트에서 기술 스펙을 추출한 뒤 JSON 형태로 변환하는
        2단계 체인 패턴을 가장 단순한 형태로 보여준다.
    데이터 흐름: text_input -> extraction_chain -> transform_chain -> final_result.
"""

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

# LLM 클라이언트 초기화: 환경 변수(예: OPENAI_API_KEY)가 사전에 설정되어야 한다.
llm: ChatOpenAI = ChatOpenAI(temperature=0)

# 1단계 프롬프트: 원문에서 기술 스펙을 추출한다.
prompt_extract: ChatPromptTemplate = ChatPromptTemplate.from_template(
    "Extract the technical specifications from the following text:\n\n{text_input}"
)

# 2단계 프롬프트: 추출된 스펙을 표준 JSON 키(cpu, memory, storage)로 변환한다.
prompt_transform: ChatPromptTemplate = ChatPromptTemplate.from_template(
    "Transform the following specifications into a JSON object with "
    "'cpu', 'memory', and 'storage' as keys:\n\n{specifications}"
)

# 추출 체인: 텍스트 입력 -> LLM -> 문자열 파서.
extraction_chain = prompt_extract | llm | StrOutputParser()

# 전체 체인: extraction 결과를 specifications 변수로 주입해 변환 프롬프트에 연결한다.
full_chain = {"specifications": extraction_chain} | prompt_transform | llm | StrOutputParser()

# 데모 입력 텍스트(정적 샘플).
input_text: str = (
    "The new laptop model features a 3.5 GHz octa-core processor, "
    "16GB of RAM, and a 1TB NVMe SSD."
)

# 체인 실행 및 최종 결과 출력.
final_result: str = full_chain.invoke({"text_input": input_text})
print("\n--- Final JSON Output ---")
print(final_result)
