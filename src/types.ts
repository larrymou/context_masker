export type Category = 'pii' | 'credentials' | 'infrastructure';

export interface PatternConfig {
  name: string;
  regex: RegExp;
  category: Category;
}

export interface MaskerConfig {
  enabled: Category[];
  patternFlags?: Record<string, Record<string, boolean>>;
  sessionTTL: number;
  logging?: boolean;
  customPatterns?: CustomPattern[];
}

export interface CustomPattern {
  name: string;
  regex: string;
  flags?: string;
  category: Category;
}

export interface MaskResult {
  masked: string;
  mappings: Map<string, string>;
}
