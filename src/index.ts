import { MaskerConfig, Category, CustomPattern, PatternConfig } from './types.js';
import { Masker } from './masker.js';
import { Restorer } from './restorer.js';
import { SessionStore } from './session/store.js';
import { MaskingLogger, MaskingMetrics } from './logger.js';
import { CustomPatternRegistry } from './custom-patterns.js';

export interface ContextMasker {
  mask: (text: string) => { masked: string; mappings: Map<string, string> };
  restore: (text: string) => string;
  clear: () => void;
  getMetrics: () => MaskingMetrics;
  resetMetrics: () => void;
  setLogging: (enabled: boolean) => void;
  addCustomPattern: (pattern: CustomPattern) => void;
  removeCustomPattern: (name: string) => boolean;
}

export function createContextMasker(config?: Partial<MaskerConfig>): ContextMasker {
  const store = new SessionStore(config?.sessionTTL ?? 300000);
  const logger = new MaskingLogger(config?.logging ?? false);
  const customRegistry = new CustomPatternRegistry();
  
  // Load custom patterns from config
  if (config?.customPatterns) {
    customRegistry.loadFromConfig(config.customPatterns);
  }
  
  let masker = new Masker(config, customRegistry.getPatterns());
  const restorer = new Restorer(store);

  const rebuildMasker = () => {
    masker = new Masker(config, customRegistry.getPatterns());
  };

  return {
    mask: (text: string) => {
      const start = Date.now();
      const result = masker.mask(text);
      const duration = Date.now() - start;
      
      // Sync mappings to shared store
      for (const [placeholder, original] of result.mappings) {
        store.set(placeholder, original);
      }
      
      // Record metrics
      const types: Record<string, number> = {};
      const categories: Record<string, number> = {};
      
      for (const [placeholder] of result.mappings) {
        const type = placeholder.replace(/^<<|:?\*\*\*>>$/g, '');
        types[type] = (types[type] || 0) + 1;
      }
      
      logger.recordMask(result.mappings.size, types, {}, duration);
      
      return result;
    },
    
    restore: (text: string) => {
      const start = Date.now();
      const result = restorer.restore(text);
      const duration = Date.now() - start;
      
      // Count restored placeholders
      const matches = text.match(/<<[A-Z_]+:\*\*\*>>/g) || [];
      logger.recordRestore(matches.length, duration);
      
      return result;
    },
    
    clear: () => {
      masker.clear();
      store.clear();
      logger.log('Session cleared');
    },
    
    getMetrics: () => logger.getMetrics(),
    
    resetMetrics: () => {
      logger.resetMetrics();
      logger.log('Metrics reset');
    },
    
    setLogging: (enabled: boolean) => {
      logger.setEnabled(enabled);
      logger.log(`Logging ${enabled ? 'enabled' : 'disabled'}`);
    },
    
    addCustomPattern: (pattern: CustomPattern) => {
      customRegistry.addPattern(pattern);
      rebuildMasker();
      logger.log(`Added custom pattern: ${pattern.name}`);
    },
    
    removeCustomPattern: (name: string) => {
      const removed = customRegistry.removePattern(name);
      if (removed) {
        rebuildMasker();
        logger.log(`Removed custom pattern: ${name}`);
      }
      return removed;
    },
  };
}

export type { Category, MaskerConfig, CustomPattern, MaskingMetrics };
