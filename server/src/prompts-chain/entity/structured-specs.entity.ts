export type StructuredSpecsProps = {
  cpu: string;
  memory: string;
  storage: string;
};

export class StructuredSpecs {
  private constructor(private readonly props: StructuredSpecsProps) {}

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

  toObject(): StructuredSpecsProps {
    return { ...this.props };
  }

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
