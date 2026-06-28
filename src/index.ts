import { MaskerConfig, Category, CustomPattern } from './types.js';
import { Masker } from './masker.js';
import { Restorer } from './restorer.js';
import { SessionStore } from './session/store.js';
import { MaskingLogger, MaskingMetrics } from './logger.js';
import { CustomPatternRegistry } from './custom-patterns.js';
import { getEnabledPatterns } from './patterns/index.js';
import { loadConfig } from './config.js';

export interface ContextMasker {
  mask: (text: string) => { masked: string; mappings: Map<string, string> };
  restore: (text: string) => string;
  clear: () => void;
  loadMappings: (entries: Record<string, string>) => void;
  getCounters: () => Record<string, number>;
  setCounters: (counters: Record<string, number>) => void;
  getMetrics: () => MaskingMetrics;
  resetMetrics: () => void;
  setLogging: (enabled: boolean) => void;
  addCustomPattern: (pattern: CustomPattern) => void;
  removeCustomPattern: (name: string) => boolean;
}

export function createContextMasker(overrides?: Partial<MaskerConfig>): ContextMasker {
  const resolved = overrides ? { ...loadConfig(), ...overrides } : loadConfig();
  const store = new SessionStore(resolved.sessionTTL ?? 300000);
  const logger = new MaskingLogger(resolved.logging ?? false);
  const customRegistry = new CustomPatternRegistry();
  
  if (resolved.customPatterns) {
    customRegistry.loadFromConfig(resolved.customPatterns);
  }
  
  let masker = new Masker(store, resolved, customRegistry.getPatterns());
  const restorer = new Restorer(store);

  const rebuildMasker = () => {
    masker = new Masker(store, resolved, customRegistry.getPatterns());
  };

  return {
    mask: (text: string) => {
      const start = Date.now();
      const result = masker.mask(text);
      const duration = Date.now() - start;
      
      const types: Record<string, number> = {};
      const categories: Record<string, number> = {};
      
      for (const [placeholder] of result.mappings) {
        const type = placeholder.replace(/^<<|:\d+\*\*\*>>$/g, '');
        types[type] = (types[type] || 0) + 1;
      }
      
      const enabledCategories = resolved.enabled ?? ['pii', 'credentials', 'infrastructure'];
      for (const cat of enabledCategories) {
        const patterns = getEnabledPatterns([cat], resolved.patternFlags);
        let count = 0;
        for (const [placeholder] of result.mappings) {
          const type = placeholder.replace(/^<<|:\d+\*\*\*>>$/g, '').toLowerCase();
          if (patterns.some(p => p.name === type)) {
            count++;
          }
        }
        if (count > 0) categories[cat] = count;
      }
      
      logger.recordMask(result.mappings.size, types, categories, duration);
      
      return result;
    },
    
    restore: (text: string) => {
      const start = Date.now();
      const result = restorer.restore(text);
      const duration = Date.now() - start;
      
      const matches = text.match(/<<[A-Z_]+:\d+\*\*\*>>/g) || [];
      logger.recordRestore(matches.length, duration);
      
      return result;
    },
    
    clear: () => {
      masker.clear();
      store.clear();
      logger.log('Session cleared');
    },
    
    loadMappings: (entries: Record<string, string>) => {
      masker.loadMappings(entries);
    },
    
    getCounters: () => masker.getCounters(),
    
    setCounters: (counters: Record<string, number>) => {
      masker.setCounters(counters);
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
