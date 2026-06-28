import { Category, MaskResult, MaskerConfig, PatternConfig } from './types.js';
import { detectSensitiveData } from './engine/regex.js';
import { SessionStore } from './session/store.js';

export class Masker {
  private store: SessionStore;
  private categories: Category[];
  private patternFlags?: Record<string, Record<string, boolean>>;
  private customPatterns: PatternConfig[];
  private counter = new Map<string, number>();

  constructor(store: SessionStore, config?: Partial<MaskerConfig>, customPatterns: PatternConfig[] = []) {
    this.store = store;
    this.categories = config?.enabled ?? ['pii', 'credentials', 'infrastructure'];
    this.patternFlags = config?.patternFlags;
    this.customPatterns = customPatterns;
  }

  mask(text: string): MaskResult {
    const detections = detectSensitiveData(text, this.categories, this.customPatterns, this.patternFlags);
    const mappings = new Map<string, string>();
    let masked = text;

    // Process in reverse order to maintain string positions
    for (let i = detections.length - 1; i >= 0; i--) {
      const detection = detections[i];
      const count = this.counter.get(detection.type) ?? 0;
      this.counter.set(detection.type, count + 1);
      const placeholder = `<<${detection.type.toUpperCase()}:${count}***>>`;
      
      masked = masked.slice(0, detection.start) + placeholder + masked.slice(detection.end);
      mappings.set(placeholder, detection.value);
      this.store.set(placeholder, detection.value);
    }

    return { masked, mappings };
  }

  loadMappings(entries: Record<string, string>): void {
    for (const [placeholder, original] of Object.entries(entries)) {
      this.store.set(placeholder, original);
    }
  }

  clear(): void {
    this.counter.clear();
  }
}
