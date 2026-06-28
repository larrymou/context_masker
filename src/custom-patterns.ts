import { PatternConfig, Category, CustomPattern } from './types.js';

export class CustomPatternRegistry {
  private patterns: PatternConfig[] = [];

  constructor() {
    this.patterns = [];
  }

  addPattern(config: CustomPattern): void {
    const regex = new RegExp(config.regex, config.flags || 'g');
    
    this.patterns.push({
      name: config.name,
      regex,
      category: config.category,
    });
  }

  removePattern(name: string): boolean {
    const index = this.patterns.findIndex(p => p.name === name);
    if (index !== -1) {
      this.patterns.splice(index, 1);
      return true;
    }
    return false;
  }

  getPatterns(): PatternConfig[] {
    return [...this.patterns];
  }

  clear(): void {
    this.patterns = [];
  }

  loadFromConfig(patterns: CustomPattern[]): void {
    for (const pattern of patterns) {
      this.addPattern(pattern);
    }
  }
}

export function parseCustomPatterns(config: Record<string, unknown>): CustomPattern[] {
  const patterns: CustomPattern[] = [];
  const customPatterns = config.custom_patterns as Record<string, unknown> | undefined;
  
  if (!customPatterns) return patterns;
  
  for (const [name, value] of Object.entries(customPatterns)) {
    const pattern = value as Record<string, unknown>;
    
    if (typeof pattern.regex === 'string' && typeof pattern.placeholder === 'string') {
      patterns.push({
        name,
        regex: pattern.regex,
        flags: (pattern.flags as string) || 'g',
        placeholder: pattern.placeholder,
        category: (pattern.category as Category) || 'pii',
      });
    }
  }
  
  return patterns;
}
