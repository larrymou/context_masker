import { describe, it, expect, beforeEach } from 'vitest';
import { TTLMap } from '../../src/session/ttl.js';

describe('TTLMap', () => {
  let map: TTLMap<string, string>;

  beforeEach(() => {
    map = new TTLMap(60000);
  });

  it('should store and retrieve values', () => {
    map.set('key1', 'value1');
    expect(map.get('key1')).toBe('value1');
  });

  it('should return null for missing keys', () => {
    expect(map.get('missing')).toBeNull();
  });

  it('should overwrite existing keys', () => {
    map.set('key1', 'value1');
    map.set('key1', 'value2');
    expect(map.get('key1')).toBe('value2');
  });

  it('should expire entries after TTL', async () => {
    const shortMap = new TTLMap<string, string>(100);
    shortMap.set('key1', 'value1');

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(shortMap.get('key1')).toBeNull();
  });

  it('should report size including expired entries', () => {
    map.set('key1', 'value1');
    map.set('key2', 'value2');
    expect(map.size).toBe(2);
  });

  it('should not count expired entries removed by get', async () => {
    const shortMap = new TTLMap<string, string>(100);
    shortMap.set('key1', 'value1');
    shortMap.set('key2', 'value2');

    await new Promise(resolve => setTimeout(resolve, 150));

    // get removes expired entries from internal map
    shortMap.get('key1');
    expect(shortMap.size).toBe(1);
  });

  it('should clear all entries', () => {
    map.set('key1', 'value1');
    map.set('key2', 'value2');
    map.clear();

    expect(map.get('key1')).toBeNull();
    expect(map.size).toBe(0);
  });
});
