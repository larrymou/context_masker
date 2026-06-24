import { describe, it, expect } from 'vitest';
import { createContextMasker, ContextMasker } from '../src/index.js';

describe('Tool Integration', () => {
  let masker: ContextMasker;

  beforeEach(() => {
    masker = createContextMasker();
  });

  describe('Claude Code / OpenCode pattern', () => {
    it('should mask tool output before LLM call', () => {
      const toolOutput = `
        $ git status
        On branch main
        Remote: postgres://admin:pass@db.example.com/mydb
        Contact: user@company.com
      `;

      const { masked } = masker.mask(toolOutput);

      expect(masked).toContain('<<DB_URL:***>>');
      expect(masked).toContain('<<EMAIL:***>>');
      expect(masked).not.toContain('pass@db.example.com');
      expect(masked).not.toContain('user@company.com');
    });

    it('should restore placeholders in LLM response', () => {
      const toolOutput = 'Remote: postgres://admin:pass@db.example.com/mydb, Contact: user@company.com';
      masker.mask(toolOutput);

      const llmResponse = 'The database at <<DB_URL:***>> is connected. Email <<EMAIL:***>> for access.';
      const restored = masker.restore(llmResponse);

      expect(restored).toContain('postgres://admin:pass@db.example.com/mydb');
      expect(restored).toContain('user@company.com');
    });
  });

  describe('OpenWork pattern', () => {
    it('should handle multi-line tool output with secrets', () => {
      const toolOutput = `#!/bin/bash
export DATABASE_URL=postgres://admin:secret123@localhost:5432/prod
export API_KEY=sk-1234567890abcdef1234567890
echo "Config loaded"`;

      const { masked } = masker.mask(toolOutput);

      expect(masked).toContain('<<DB_URL:***>>');
      expect(masked).toContain('<<API_KEY:***>>');
    });

    it('should preserve non-sensitive context', () => {
      const toolOutput = 'Running tests on feature-branch... 15/15 passed';
      const { masked, mappings } = masker.mask(toolOutput);

      expect(masked).toBe(toolOutput);
      expect(mappings.size).toBe(0);
    });
  });

  describe('Hermes / Windsurf pattern', () => {
    it('should handle environment variable assignments', () => {
      const toolOutput = `
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
DATABASE_URL=mysql://root:password123@db-host:3306/mydb
      `;

      const { masked } = masker.mask(toolOutput);

      expect(masked).toContain('<<AWS_SECRET:***>>');
      expect(masked).toContain('<<DB_URL:***>>');
    });

    it('should handle JSON config output', () => {
      const toolOutput = JSON.stringify({
        db: 'postgres://admin:pass@host/db',
        email: 'admin@example.com'
      });

      const { masked } = masker.mask(toolOutput);

      expect(masked).toContain('<<DB_URL:***>>');
      expect(masked).toContain('<<EMAIL:***>>');
    });
  });

  describe('Cursor / Copilot pattern', () => {
    it('should handle git commands with remote URLs', () => {
      const toolOutput = `
$ git remote -v
origin	https://oauth2:ghp_xxxxxxxxxxxx@github.com/user/repo.git (fetch)
origin	https://oauth2:ghp_xxxxxxxxxxxx@github.com/user/repo.git (push)
      `;

      const { masked } = masker.mask(toolOutput);

      expect(masked).not.toContain('ghp_xxxxxxxxxxxx');
    });

    it('should handle npm/yarn output with tokens', () => {
      const toolOutput = `
npm notice registry: https://registry.npmjs.org/
npm notice authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U
      `;

      const { masked } = masker.mask(toolOutput);

      expect(masked).toContain('<<JWT:***>>');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty input', () => {
      const { masked, mappings } = masker.mask('');
      expect(masked).toBe('');
      expect(mappings.size).toBe(0);
    });

    it('should handle nested sensitive data', () => {
      const toolOutput = `Config: {"database": {"url": "postgres://user:pass@host/db"}, "email": "test@test.com"}`;
      const { masked } = masker.mask(toolOutput);

      expect(masked).toContain('<<DB_URL:***>>');
      expect(masked).toContain('<<EMAIL:***>>');
    });

    it('should handle multiple same placeholder types', () => {
      const toolOutput = 'Email 1: a@b.com, Email 2: c@d.com';
      const { masked } = masker.mask(toolOutput);

      expect(masked).toContain('<<EMAIL:***>>');
      expect(masked).not.toContain('a@b.com');
      expect(masked).not.toContain('c@d.com');
    });

    it('should clear session on demand', () => {
      masker.mask('Email: test@test.com');
      masker.clear();

      const restored = masker.restore('<<EMAIL:***>>');
      expect(restored).toBe('<<EMAIL:***>>');
    });
  });

  describe('Performance', () => {
    it('should mask large text quickly', () => {
      const largeText = 'x'.repeat(10000) + ' test@example.com ' + 'y'.repeat(10000);

      const start = Date.now();
      masker.mask(largeText);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });
});
