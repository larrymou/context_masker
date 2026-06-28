import { describe, it, expect, beforeEach } from 'vitest';
import { createContextMasker } from '../src/index.js';

describe('ContextMasker Advanced Features', () => {
  let masker: ReturnType<typeof createContextMasker>;

  beforeEach(() => {
    masker = createContextMasker({ logging: false });
  });

  describe('Logging and Metrics', () => {
    it('should track masking metrics', () => {
      masker.mask('Email: test@example.com, DB: postgres://admin:pass@host/db');
      
      const metrics = masker.getMetrics();
      expect(metrics.totalCalls).toBe(1);
      expect(metrics.totalMasked).toBe(2);
    });

    it('should track restore metrics', () => {
      masker.mask('Email: test@example.com');
      masker.restore('<<EMAIL:0***>>');
      
      const metrics = masker.getMetrics();
      expect(metrics.totalRestored).toBe(1);
    });

    it('should reset metrics', () => {
      masker.mask('Email: test@example.com');
      masker.resetMetrics();
      
      const metrics = masker.getMetrics();
      expect(metrics.totalCalls).toBe(0);
    });

    it('should enable/disable logging', () => {
      masker.setLogging(true);
      masker.mask('Email: test@example.com');
      masker.setLogging(false);
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Custom Patterns', () => {
    it('should add custom pattern', () => {
      masker.addCustomPattern({
        name: 'custom_id',
        regex: '\\bID-[0-9]{6}\\b',
        category: 'pii',
      });

      const { masked } = masker.mask('User ID-123456 created');
      expect(masked).toContain('<<CUSTOM_ID:0***>>');
    });

    it('should remove custom pattern', () => {
      masker.addCustomPattern({
        name: 'temp_pattern',
        regex: '\\bTEMP-[0-9]+\\b',
        category: 'pii',
      });

      const removed = masker.removeCustomPattern('temp_pattern');
      expect(removed).toBe(true);

      const { masked } = masker.mask('Value TEMP-123');
      expect(masked).not.toContain('<<TEMP');
    });

    it('should load custom patterns from config', () => {
      const maskerWithConfig = createContextMasker({
        customPatterns: [
          {
            name: 'config_pattern',
            regex: '\\bCFG-[A-Z]+\\b',
            category: 'pii',
          },
        ],
      });

      const { masked } = maskerWithConfig.mask('Config CFG-ABC');
      expect(masked).toContain('<<CONFIG_PATTERN:0***>>');
    });
  });

  describe('Clear Session', () => {
    it('should clear session and mappings', () => {
      masker.mask('Email: test@test.com');
      masker.clear();

      const restored = masker.restore('<<EMAIL:0***>>');
      expect(restored).toBe('<<EMAIL:0***>>');
    });
  });
});
