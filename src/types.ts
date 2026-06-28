export type Category = 'pii' | 'credentials' | 'infrastructure';

export interface PatternConfig {
  name: string;
  regex: RegExp;
  placeholder: (match: string) => string;
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
  placeholder: string;
  category: Category;
}

export interface MaskResult {
  masked: string;
  mappings: Map<string, string>;
}

export interface SessionEntry {
  placeholder: string;
  original: string;
  timestamp: number;
}
