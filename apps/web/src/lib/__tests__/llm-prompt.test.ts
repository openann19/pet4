import { describe, it, expect } from 'vitest';
import { buildLLMPrompt } from '../llm-prompt';

describe('buildLLMPrompt', () => {
  it('should handle empty template', () => {
    const result = buildLLMPrompt``;
    expect(result).toBe('');
  });

  it('should handle simple string template', () => {
    const result = buildLLMPrompt`Hello, world!`;
    expect(result).toBe('Hello, world!');
  });

  it('should handle string values', () => {
    const name = 'John';
    const result = buildLLMPrompt`Hello, ${name}!`;
    expect(result).toBe('Hello, John!');
  });

  it('should handle number values', () => {
    const age = 25;
    const result = buildLLMPrompt`Age: ${age}`;
    expect(result).toBe('Age: 25');
  });

  it('should handle boolean values', () => {
    const active = true;
    const result = buildLLMPrompt`Active: ${active}`;
    expect(result).toBe('Active: true');
  });

  it('should handle bigint values', () => {
    const bigNumber = BigInt(12345678901234567890n);
    const result = buildLLMPrompt`Big number: ${bigNumber}`;
    expect(result).toBe('Big number: 12345678901234567890');
  });

  it('should handle Date objects', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const result = buildLLMPrompt`Date: ${date}`;
    expect(result).toBe('Date: 2023-01-01T00:00:00.000Z');
  });

  it('should handle arrays', () => {
    const items = ['apple', 'banana', 'orange'];
    const result = buildLLMPrompt`Items: ${items}`;
    expect(result).toBe('Items: ["apple","banana","orange"]');
  });

  it('should handle plain objects', () => {
    const user = { name: 'John', age: 30 };
    const result = buildLLMPrompt`User: ${user}`;
    expect(result).toBe('User: {"name":"John","age":30}');
  });

  it('should handle nested objects', () => {
    const data = { user: { name: 'John', profile: { age: 30 } } };
    const result = buildLLMPrompt`Data: ${data}`;
    expect(result).toBe('Data: {"user":{"name":"John","profile":{"age":30}}}');
  });

  it('should handle null values', () => {
    const result = buildLLMPrompt`Value: ${null}`;
    expect(result).toBe('Value: ');
  });

  it('should handle undefined values', () => {
    const result = buildLLMPrompt`Value: ${undefined}`;
    expect(result).toBe('Value: ');
  });

  it('should handle mixed values', () => {
    const name = 'John';
    const age = 30;
    const active = true;
    const date = new Date('2023-01-01T00:00:00.000Z');
    const tags = ['developer', 'javascript'];
    const result = buildLLMPrompt`User: ${name}, Age: ${age}, Active: ${active}, Date: ${date}, Tags: ${tags}`;
    expect(result).toBe(
      'User: John, Age: 30, Active: true, Date: 2023-01-01T00:00:00.000Z, Tags: ["developer","javascript"]'
    );
  });

  it('should handle multiple placeholders', () => {
    const first = 'Hello';
    const second = 'World';
    const result = buildLLMPrompt`${first}, ${second}!`;
    expect(result).toBe('Hello, World!');
  });

  it('should handle empty strings in placeholders', () => {
    const result = buildLLMPrompt`Start${''}End`;
    expect(result).toBe('StartEnd');
  });

  it('should handle zero values', () => {
    const result = buildLLMPrompt`Count: ${0}`;
    expect(result).toBe('Count: 0');
  });

  it('should handle false boolean values', () => {
    const result = buildLLMPrompt`Active: ${false}`;
    expect(result).toBe('Active: false');
  });

  it('should handle custom objects with prototypes', () => {
    class CustomClass {
      constructor(public name: string) {}
    }

    const custom = new CustomClass('test');
    const result = buildLLMPrompt`Custom: ${custom}`;
    expect(result).toBe('Custom: {"name":"test"}');
  });

  it('should handle circular references gracefully', () => {
    const circular: any = { name: 'test' };
    circular.self = circular;

    // Should not throw an error
    const result = buildLLMPrompt`Circular: ${circular}`;
    expect(typeof result).toBe('string');
    expect(result).toContain('Circular:');
  });

  it('should handle objects that cannot be stringified', () => {
    const problematic: any = {};
    Object.defineProperty(problematic, 'problematic', {
      get() {
        throw new Error('Cannot access');
      },
      enumerable: true,
    });

    // Should not throw an error
    const result = buildLLMPrompt`Problematic: ${problematic}`;
    expect(typeof result).toBe('string');
    expect(result).toContain('Problematic:');
  });

  it('should handle functions', () => {
    const func = function test() {
      return 'function';
    };
    const result = buildLLMPrompt`Function: ${func}`;
    expect(result).toBe('Function: Unsupported value type');
  });

  it('should handle symbols', () => {
    const symbol = Symbol('test');
    const result = buildLLMPrompt`Symbol: ${symbol}`;
    expect(result).toBe('Symbol: Unsupported value type');
  });

  it('should handle complex nested structures', () => {
    const complex = {
      users: [
        { name: 'John', roles: ['admin', 'user'] },
        { name: 'Jane', roles: ['user'] },
      ],
      metadata: {
        version: '1.0.0',
        created: new Date('2023-01-01T00:00:00.000Z'),
        active: true,
      },
    };

    const result = buildLLMPrompt`Complex: ${complex}`;
    expect(result).toContain('Complex:');
    expect(result).toContain('John');
    expect(result).toContain('Jane');
    expect(result).toContain('admin');
    expect(result).toContain('1.0.0');
    expect(result).toContain('2023-01-01T00:00:00.000Z');
    expect(result).toContain('true');
  });

  it('should preserve template literal structure', () => {
    const name = 'John';
    const age = 30;
    const result = buildLLMPrompt`{
  "name": "${name}",
  "age": ${age},
  "active": true
}`;

    expect(result).toContain(`{
  "name": "John",
  "age": 30,
  "active": true
}`);
  });

  it('should handle large numbers', () => {
    const largeNumber = Number.MAX_SAFE_INTEGER;
    const result = buildLLMPrompt`Large: ${largeNumber}`;
    expect(result).toBe(`Large: ${largeNumber}`);
  });

  it('should handle negative values', () => {
    const negative = -42;
    const result = buildLLMPrompt`Negative: ${negative}`;
    expect(result).toBe('Negative: -42');
  });

  it('should handle floating point numbers', () => {
    const pi = 3.14159;
    const result = buildLLMPrompt`Pi: ${pi}`;
    expect(result).toBe('Pi: 3.14159');
  });
});

describe('isPlainObject', () => {
  it('should identify plain objects correctly', () => {
    expect(buildLLMPrompt`${{}}`).toContain('{}');
  });

  it('should handle objects with null prototype', () => {
    const obj = Object.create(null);
    obj.name = 'test';
    expect(buildLLMPrompt`${obj}`).toContain('{"name":"test"}');
  });

  it('should handle class instances', () => {
    class TestClass {
      constructor(public name: string) {}
    }

    const instance = new TestClass('test');
    expect(buildLLMPrompt`${instance}`).toContain('{"name":"test"}');
  });

  it('should handle arrays correctly', () => {
    const arr = [1, 2, 3];
    expect(buildLLMPrompt`${arr}`).toBe('[1,2,3]');
  });
});
