import { describe, it, expect } from 'vitest';
import { createContextMasker } from '../src/index.js';

describe('Context Masker Integration', () => {
  it('should mask and restore in full workflow', () => {
    const masker = createContextMasker();
    
    const toolOutput = `
      Database: postgres://admin:secret123@db.example.com:5432/mydb
      Contact: support@company.com
      API Key: api_key=sk-abcdef1234567890abcdef12
    `;
    
    // Mask before sending to LLM
    const { masked } = masker.mask(toolOutput);
    
    expect(masked).toContain('<<DATABASE_URL:0***>>');
    expect(masked).toContain('<<EMAIL:0***>>');
    expect(masked).toContain('<<API_KEY:0***>>');
    expect(masked).not.toContain('secret123');
    expect(masked).not.toContain('support@company.com');
    
    // Restore after receiving LLM response
    const llmResponse = `I found the database at <<DATABASE_URL:0***>> and emailed <<EMAIL:0***>>`;
    const restored = masker.restore(llmResponse);
    
    expect(restored).toContain('postgres://admin:secret123@db.example.com:5432/mydb');
    expect(restored).toContain('support@company.com');
  });

  it('should handle nested sensitive data', () => {
    const masker = createContextMasker();
    
    const input = 'Config: {"db": "mysql://root:pass@localhost/db", "email": "admin@test.com"}';
    const { masked } = masker.mask(input);
    
    expect(masked).toContain('<<DATABASE_URL:0***>>');
    expect(masked).toContain('<<EMAIL:0***>>');
  });
});
