/**
 * Formats tagged template input into a string suitable for LLM prompts.
 * Falls back to JSON for objects to retain useful structure.
 */
export function buildLLMPrompt(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((acc, current, index) => {
    const value = values[index];
    if (value === undefined) {
      return acc + current;
    }

    if (value === null) {
      return acc + current;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'bigint' ||
      typeof value === 'boolean'
    ) {
      return acc + current + String(value);
    }

    if (value instanceof Date) {
      return acc + current + value.toISOString();
    }

    try {
      if (Array.isArray(value) || isPlainObject(value)) {
        return acc + current + JSON.stringify(value);
      }
    } catch {
      // fall through to generic stringification
    }

    return (
      acc +
      current +
      (typeof value === 'object' && value !== null
        ? JSON.stringify(value)
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : 'Unsupported value type')
    );
  }, '');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value) as object | null;
  return prototype === Object.prototype || prototype === null;
}
