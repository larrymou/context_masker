import { describe, it, expect } from 'vitest';
import { detectSensitiveData } from '../../src/engine/regex.js';

describe('detectSensitiveData', () => {
  it('should detect email addresses', () => {
    const text = 'Contact me at user@example.com';
    const results = detectSensitiveData(text);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('email');
    expect(results[0].value).toBe('user@example.com');
  });

  it('should detect API keys', () => {
    const text = 'api_key=abcdefghijabcdefghij1234';
    const results = detectSensitiveData(text);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('api_key');
  });

  it('should detect database URLs', () => {
    const text = 'DATABASE_URL=postgres://user:pass@host:5432/db';
    const results = detectSensitiveData(text);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('database_url');
  });

  it('should detect multiple sensitive items', () => {
    const text = 'Email: test@test.com, API: api_key=abcdefghijabcdefghij1234';
    const results = detectSensitiveData(text);
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it('should return empty array for clean text', () => {
    const text = 'This is a normal sentence without sensitive data.';
    const results = detectSensitiveData(text);
    expect(results).toHaveLength(0);
  });
});
