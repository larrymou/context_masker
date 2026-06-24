import { TTLMap } from './ttl.js';

export class SessionStore {
  private store: TTLMap<string, string>;

  constructor(ttlMs: number = 300000) { // 5 minutes default
    this.store = new TTLMap(ttlMs);
  }

  set(placeholder: string, original: string): void {
    this.store.set(placeholder, original);
  }

  get(placeholder: string): string | null {
    return this.store.get(placeholder);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}