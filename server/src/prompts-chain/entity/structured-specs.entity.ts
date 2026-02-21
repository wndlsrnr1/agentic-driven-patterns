/**
 * prompts-chain 도메인 값 객체의 핵심 불변식이다.
 *
 * Context:
 * - 적용 대상: `StructuredSpecs`.
 * - 사용 목적: `cpu`, `memory`, `storage` 세 필드를 비어 있지 않은 문자열로 유지한다.
 */
/**
 * 구조화된 기술 스펙 값 객체의 직렬화 형태다.
 *
 * Context:
 * - 생성자: `StructuredSpecs.fromUnknown`.
 * - 소비자: `PromptsChainService.run` 응답 DTO 매핑.
 * - 데이터 흐름: parser output -> entity -> plain object DTO.
 */
export type StructuredSpecsProps = {
  cpu: string;
  memory: string;
  storage: string;
};

/**
 * CPU/메모리/스토리지 불변성을 보장하는 도메인 엔티티다.
 *
 * Context:
 * - 호출자: `StructuredOutputParserUtil.parse`.
 * - 사용 목적: 파싱 결과를 API 계약에 맞는 정규화된 값으로 제한한다.
 * - 데이터 흐름: unknown/object -> field validation -> immutable props.
 *
 * Side effects:
 * - 없음(순수 검증/변환 로직).
 */
export class StructuredSpecs {
  private constructor(private readonly props: StructuredSpecsProps) {}

  /**
   * 알 수 없는 입력을 검증해 `StructuredSpecs`를 생성한다.
   *
   * Context:
   * - 호출자: `StructuredOutputParserUtil`의 JSON/fallback 경로.
   * - 사용 목적: 외부 모델 출력이 최소 필드/문자열 제약을 만족하는지 강제한다.
   * - 데이터 흐름: unknown -> record cast -> field별 validate -> entity.
   *
   * @param input 모델 출력에서 파싱된 객체.
   * @returns 검증된 불변 엔티티.
   * @throws `Error` 입력이 객체가 아니거나 필드 검증에 실패하면 발생한다.
   */
  static fromUnknown(input: unknown): StructuredSpecs {
    if (!input || typeof input !== 'object') {
      throw new Error('Failed to parse structured output.');
    }

    const record = input as Record<string, unknown>;
    return new StructuredSpecs({
      cpu: StructuredSpecs.validateField(record.cpu),
      memory: StructuredSpecs.validateField(record.memory),
      storage: StructuredSpecs.validateField(record.storage),
    });
  }

  /**
   * 엔티티 내부 값을 응답 직렬화 가능한 객체로 변환한다.
   *
   * Context:
   * - 호출자: `PromptsChainService.run`.
   * - 사용 목적: 도메인 객체를 API 응답 DTO 필드(`structuredSpecs`)로 전달한다.
   *
   * @returns `cpu/memory/storage`를 포함한 복사본 객체.
   */
  toObject(): StructuredSpecsProps {
    return { ...this.props };
  }

  /**
   * 개별 스펙 필드의 문자열 불변성을 검증한다.
   *
   * Context:
   * - 호출자: `StructuredSpecs.fromUnknown`.
   * - 사용 목적: 타입/공백 문자열을 차단해 도메인 무결성을 보장한다.
   *
   * @param value 검증 대상 필드 값.
   * @returns trim된 비어 있지 않은 문자열.
   * @throws `Error` 문자열이 아니거나 공백만 포함하면 발생한다.
   */
  private static validateField(value: unknown): string {
    if (typeof value !== 'string') {
      throw new Error('Failed to parse structured output.');
    }

    const normalized = value.trim();
    if (!normalized) {
      throw new Error('Failed to parse structured output.');
    }

    return normalized;
  }
}
