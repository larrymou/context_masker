import { Category, MaskResult, MaskerConfig } from './types.js';
import { detectSensitiveData, DetectionResult } from './engine/regex.js';
import { SessionStore } from './session/store.js';
import { getEnabledPatterns } from './patterns/index.js';

export class Masker {
  private store: SessionStore;
  private categories: Category[];
  private counter = new Map<string, number>();

  constructor(config?: Partial<MaskerConfig>) {
    this.store = new SessionStore(config?.sessionTTL ?? 300000);
    this.categories = config?.enabled ?? ['pii', 'credentials', 'infrastructure'];
  }

  mask(text: string): MaskResult {
    const detections = detectSensitiveData(text, this.categories);
    const mappings = new Map<string, string>();
    let masked = text;

    // Process in reverse order to maintain string positions
    for (let i = detections.length - 1; i >= 0; i--) {
      const detection = detections[i];
      const placeholder = this.createPlaceholder(detection);
      
      masked = masked.slice(0, detection.start) + placeholder + masked.slice(detection.end);
      mappings.set(placeholder, detection.value);
      this.store.set(placeholder, detection.value);
    }

    return { masked, mappings };
  }

  private createPlaceholder(detection: DetectionResult): string {
    const count = (this.counter.get(detection.type) ?? 0) + 1;
    this.counter.set(detection.type, count);
    return `<<${detection.type.toUpperCase()}:***>>`;
  }

  getOriginal(placeholder: string): string | null {
    return this.store.get(placeholder);
  }

  clear(): void {
    this.store.clear();
    this.counter.clear();
  }
}
