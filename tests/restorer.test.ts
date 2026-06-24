import { describe, it, expect, beforeEach } from 'vitest';
import { Restorer } from '../src/restorer.js';
import { SessionStore } from '../src/session/store.js';

describe('Restorer', () => {
  let store: SessionStore;
  let restorer: Restorer;

  beforeEach(() => {
    store = new SessionStore(60000);
    restorer = new Restorer(store);
    
    // Setup test mappings
    store.set('<<EMAIL:***>>', 'user@example.com');
    store.set('<<API_KEY:***>>', 'sk-1234567890abcdef');
  });

  it('should restore placeholders to original values', () => {
    const text = 'Email: <<EMAIL:***>>, Key: <<API_KEY:***>>';
    const restored = restorer.restore(text);
    
    expect(restored).toBe('Email: user@example.com, Key: sk-1234567890abcdef');
  });

  it('should leave non-placeholder text unchanged', () => {
    const text = 'This has no placeholders';
    const restored = restorer.restore(text);
    
    expect(restored).toBe(text);
  });

  it('should handle multiple same placeholders', () => {
    store.set('<<PHONE:***>>', '555-1234');
    const text = 'Call <<PHONE:***>> or <<PHONE:***>>';
    const restored = restorer.restore(text);
    
    expect(restored).toBe('Call 555-1234 or 555-1234');
  });

  it('should leave unknown placeholders unchanged', () => {
    const text = '<<UNKNOWN:***>>';
    const restored = restorer.restore(text);
    
    expect(restored).toBe(text);
  });
});
