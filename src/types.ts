export type Category = 'pii' | 'credentials' | 'infrastructure';

export interface PatternConfig {
  name: string;
  regex: RegExp;
  placeholder: (match: string) => string;
  category: Category;
}

export interface MaskerConfig {
  enabled: Category[];
  patterns: Record<string, string>;
  sessionTTL: number;
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
