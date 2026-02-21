import { Injectable } from '@nestjs/common';
import { StructuredSpecs } from '../entity/structured-specs.entity.js';

@Injectable()
export class StructuredOutputParserUtil {
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
