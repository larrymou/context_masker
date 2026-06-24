import { MaskerConfig, Category } from './types.js';
import { Masker } from './masker.js';
import { Restorer } from './restorer.js';
import { SessionStore } from './session/store.js';

export interface ContextMasker {
  mask: (text: string) => { masked: string; mappings: Map<string, string> };
  restore: (text: string) => string;
  clear: () => void;
}

export function createContextMasker(config?: Partial<MaskerConfig>): ContextMasker {
  const store = new SessionStore(config?.sessionTTL ?? 300000);
  const masker = new Masker(config);
  const restorer = new Restorer(store);

  return {
    mask: (text: string) => {
      const result = masker.mask(text);
      // Sync mappings to shared store
      for (const [placeholder, original] of result.mappings) {
        store.set(placeholder, original);
      }
      return result;
    },
    restore: (text: string) => restorer.restore(text),
    clear: () => {
      masker.clear();
      store.clear();
    },
  };
}

export type { Category, MaskerConfig };
