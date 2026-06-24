import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('should load default config', () => {
    const config = loadConfig();
    expect(config.enabled).toContain('pii');
    expect(config.enabled).toContain('credentials');
    expect(config.enabled).toContain('infrastructure');
    expect(config.sessionTTL).toBe(300000);
  });

  it('should merge with custom config', () => {
    const config = loadConfig({ sessionTTL: 60000 });
    expect(config.sessionTTL).toBe(60000);
  });
});
