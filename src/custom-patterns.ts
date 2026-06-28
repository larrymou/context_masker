import { PatternConfig, CustomPattern } from './types.js';

export class CustomPatternRegistry {
  private patterns: PatternConfig[] = [];

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

  loadFromConfig(patterns: CustomPattern[]): void {
    for (const pattern of patterns) {
      this.addPattern(pattern);
    }
  }
}
