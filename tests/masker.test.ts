import { describe, it, expect, beforeEach } from 'vitest';
import { Masker } from '../src/masker.js';

describe('Masker', () => {
  let masker: Masker;

  beforeEach(() => {
    masker = new Masker();
  });

  it('should mask email addresses with placeholders', () => {
    const text = 'Contact user@example.com for info';
    const result = masker.mask(text);
    
    expect(result.masked).toContain('<<EMAIL:***>>');
    expect(result.masked).not.toContain('user@example.com');
    expect(result.mappings.size).toBe(1);
  });

  it('should preserve original in mapping', () => {
    const text = 'Email: test@company.com';
    const result = masker.mask(text);
    
    const original = result.mappings.get('<<EMAIL:***>>');
    expect(original).toBe('test@company.com');
  });

  it('should mask multiple sensitive items', () => {
    const text = 'Email: a@b.com, API: sk-1234567890abcdef1234567890';
    const result = masker.mask(text);
    
    expect(result.mappings.size).toBeGreaterThanOrEqual(2);
  });

  it('should not mask clean text', () => {
    const text = 'This is safe text';
    const result = masker.mask(text);
    
    expect(result.masked).toBe(text);
    expect(result.mappings.size).toBe(0);
  });
});
