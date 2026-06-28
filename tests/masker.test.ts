import { describe, it, expect, beforeEach } from 'vitest';
import { Masker } from '../src/masker.js';
import { SessionStore } from '../src/session/store.js';

describe('Masker', () => {
  let store: SessionStore;
  let masker: Masker;

  beforeEach(() => {
    store = new SessionStore(60000);
    masker = new Masker(store);
  });

  it('should mask email addresses with placeholders', () => {
    const text = 'Contact user@example.com for info';
    const result = masker.mask(text);
    
    expect(result.masked).toContain('<<EMAIL:0***>>');
    expect(result.masked).not.toContain('user@example.com');
    expect(result.mappings.size).toBe(1);
  });

  it('should preserve original in mapping', () => {
    const text = 'Email: test@company.com';
    const result = masker.mask(text);
    
    const original = result.mappings.get('<<EMAIL:0***>>');
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

  it('should increment counter across multiple mask calls', () => {
    masker.mask('Email: a@b.com');
    const result = masker.mask('Email: c@d.com');
    
    expect(result.masked).toContain('<<EMAIL:1***>>');
    expect(result.mappings.get('<<EMAIL:1***>>')).toBe('c@d.com');
  });

  it('should set and get counters', () => {
    masker.setCounters({ email: 5 });
    const counters = masker.getCounters();
    
    expect(counters.email).toBe(5);
    
    const result = masker.mask('Email: test@test.com');
    expect(result.masked).toContain('<<EMAIL:5***>>');
  });

  it('should load mappings into store', () => {
    masker.loadMappings({ '<<EMAIL:0***>>': 'loaded@test.com' });
    const original = store.get('<<EMAIL:0***>>');
    
    expect(original).toBe('loaded@test.com');
  });

  it('should clear counter and store', () => {
    masker.mask('Email: a@b.com');
    masker.clear();
    
    const counters = masker.getCounters();
    expect(Object.keys(counters)).toHaveLength(0);
    expect(store.get('<<EMAIL:0***>>')).toBeNull();
  });
});
