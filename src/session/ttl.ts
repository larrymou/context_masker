export class TTLMap<K, V> {
  private map = new Map<K, { value: V; expires: number }>();
  private ttl: number;

  constructor(ttlMs: number) {
    this.ttl = ttlMs;
  }

  set(key: K, value: V): void {
    this.map.set(key, {
      value,
      expires: Date.now() + this.ttl,
    });
  }

  get(key: K): V | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.map.delete(key);
      return null;
    }
    
    return entry.value;
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}