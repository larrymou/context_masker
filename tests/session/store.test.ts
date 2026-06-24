import { describe, it, expect, beforeEach } from 'vitest';
import { SessionStore } from '../../src/session/store.js';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore(60000); // 60s TTL
  });

  it('should store and retrieve mappings', () => {
    store.set('<<EMAIL:***>>', 'user@example.com');
    expect(store.get('<<EMAIL:***>>')).toBe('user@example.com');
  });

  it('should return null for unknown placeholders', () => {
    expect(store.get('<<UNKNOWN:***>>')).toBeNull();
  });

  it('should expire entries after TTL', async () => {
    const shortStore = new SessionStore(100); // 100ms TTL
    shortStore.set('<<EMAIL:***>>', 'user@example.com');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(shortStore.get('<<EMAIL:***>>')).toBeNull();
  });

  it('should clear all entries', () => {
    store.set('<<EMAIL:***>>', 'user@example.com');
    store.set('<<PHONE:***>>', '123-456-7890');
    store.clear();
    
    expect(store.get('<<EMAIL:***>>')).toBeNull();
    expect(store.get('<<PHONE:***>>')).toBeNull();
  });
});