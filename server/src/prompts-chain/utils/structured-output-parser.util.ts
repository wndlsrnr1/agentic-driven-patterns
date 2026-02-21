import { Injectable } from '@nestjs/common';
import { StructuredSpecs } from '../entity/structured-specs.entity.js';

/**
 * parser 유틸의 에러 허용 범위를 선언한다.
 *
 * Context:
 * - 적용 대상: `StructuredOutputParserUtil`.
 * - 사용 목적: JSON 우선, 실패 시 fallback, 최종 실패 시 예외라는 3단계 전략을 고정한다.
 */
/**
 * LLM 변환 출력 문자열을 도메인 엔티티로 파싱하는 유틸리티다.
 *
 * Context:
 * - 호출자: `PromptsChainService.run`.
 * - 사용 목적: JSON 우선 파싱 후 실패 시 규칙 기반 fallback 추출을 수행한다.
 * - 데이터 흐름: transform text (+ extracted text) -> parse -> `StructuredSpecs`.
 *
 * Side effects:
 * - 없음(순수 문자열 파싱).
 */
@Injectable()
export class StructuredOutputParserUtil {
  /**
   * 변환 출력 문자열을 `StructuredSpecs` 엔티티로 변환한다.
   *
   * Context:
   * - 호출자: `PromptsChainService.run`.
   * - 사용 목적: 모델 출력 품질 변동(JSON/비JSON)을 흡수해 일관된 도메인 객체를 만든다.
   * - 데이터 흐름: raw transform -> JSON parse 시도 -> fallback regex parse -> entity 생성.
   *
   * Side effects:
   * - 없음.
   *
   * @param rawTransformText 변환 체인 원문 출력.
   * @param extractedText 추출 체인 원문 출력(보조 fallback 입력).
   * @returns `cpu/memory/storage` 불변성을 만족하는 `StructuredSpecs`.
   * @throws `Error` JSON/fallback 모두 실패하거나 필드 검증에 실패하면 발생한다.
   */
  parse(rawTransformText: string, extractedText?: string): StructuredSpecs {
    const parsedJson = this.tryParseJson(rawTransformText);
    if (parsedJson) {
      return StructuredSpecs.fromUnknown(parsedJson);
    }

    const fallback = this.tryParseFallback(`${rawTransformText}\n${extractedText ?? ''}`);
    if (fallback) {
      return StructuredSpecs.fromUnknown(fallback);
    }

    throw new Error('Failed to parse structured output.');
  }

  /**
   * 문자열에서 JSON 후보를 찾아 파싱한다.
   *
   * Context:
   * - 호출자: `parse`.
   * - 사용 목적: 순수 JSON, fenced code block, 객체 substring 케이스를 순차 시도한다.
   * - 데이터 흐름: raw text -> candidates 배열 구성 -> `JSON.parse` 반복.
   *
   * @param rawTransformText 모델 변환 출력 원문.
   * @returns 파싱 성공 시 객체, 실패 시 `null`.
   */
  private tryParseJson(rawTransformText: string): unknown | null {
    const candidates: string[] = [rawTransformText];

    const codeBlockMatches = rawTransformText.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi);
    for (const match of codeBlockMatches) {
      if (match[1]) {
        candidates.push(match[1]);
      }
    }

    const objectMatch = rawTransformText.match(/\{[\s\S]*\}/m);
    if (objectMatch?.[0]) {
      candidates.push(objectMatch[0]);
    }

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate.trim()) as unknown;
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * 비JSON 출력에서 CPU/메모리/스토리지를 정규식으로 추출한다.
   *
   * Context:
   * - 호출자: `parse`.
   * - 사용 목적: 모델이 자연어 형태로 결과를 줄 때 최소 계약 필드를 복원한다.
   * - 데이터 흐름: merged text -> labeled pattern 매칭 -> trim -> plain object.
   *
   * @param text 변환 출력과 추출 출력을 결합한 텍스트.
   * @returns 세 필드가 모두 검출되면 객체, 하나라도 누락되면 `null`.
   */
  private tryParseFallback(text: string): { cpu: string; memory: string; storage: string } | null {
    const labeledCpu =
      text.match(/(?:cpu|processor)\s*[:=-]\s*([^\n;,]+)/i)?.[1] ??
      text.match(/([0-9.]+\s*ghz[^,;\n]*(?:processor|cpu)[^,;\n]*)/i)?.[1];
    const labeledMemory =
      text.match(/(?:memory|ram)\s*[:=-]\s*([0-9.]+\s*(?:kb|mb|gb|tb)(?:\s*[a-zA-Z]+)?)/i)?.[1] ??
      text.match(/([0-9.]+\s*(?:mb|gb|tb)\s*ram)/i)?.[1];
    const labeledStorage =
      text.match(/(?:storage|disk|ssd|hdd|nvme)\s*[:=-]\s*([0-9.]+\s*(?:gb|tb)(?:\s*[a-zA-Z ]+)?)/i)
        ?.[1] ??
      text.match(/([0-9.]+\s*(?:gb|tb)\s*(?:nvme\s*)?(?:ssd|hdd))/i)?.[1];

    if (!labeledCpu || !labeledMemory || !labeledStorage) {
      return null;
    }

    return {
      cpu: labeledCpu.trim(),
      memory: labeledMemory.trim(),
      storage: labeledStorage.trim(),
    };
  }
}
