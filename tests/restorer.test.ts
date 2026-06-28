import { describe, it, expect, beforeEach } from 'vitest';
import { Restorer } from '../src/restorer.js';
import { SessionStore } from '../src/session/store.js';

describe('Restorer', () => {
  let store: SessionStore;
  let restorer: Restorer;

  beforeEach(() => {
    store = new SessionStore(60000);
    restorer = new Restorer(store);
    
    // Setup test mappings with numbered placeholders
    store.set('<<EMAIL:0***>>', 'user@example.com');
    store.set('<<API_KEY:0***>>', 'sk-1234567890abcdef');
  });

  it('should restore placeholders to original values', () => {
    const text = 'Email: <<EMAIL:0***>>, Key: <<API_KEY:0***>>';
    const restored = restorer.restore(text);
    
    expect(restored).toBe('Email: user@example.com, Key: sk-1234567890abcdef');
  });

  it('should leave non-placeholder text unchanged', () => {
    const text = 'This has no placeholders';
    const restored = restorer.restore(text);
    
    expect(restored).toBe(text);
  });

  it('should handle multiple same placeholders', () => {
    store.set('<<PHONE:0***>>', '555-1234');
    store.set('<<PHONE:1***>>', '555-5678');
    const text = 'Call <<PHONE:0***>> or <<PHONE:1***>>';
    const restored = restorer.restore(text);
    
    expect(restored).toBe('Call 555-1234 or 555-5678');
  });

  it('should leave unknown placeholders unchanged', () => {
    const text = '<<UNKNOWN:0***>>';
    const restored = restorer.restore(text);
    
    expect(restored).toBe(text);
  });
});
