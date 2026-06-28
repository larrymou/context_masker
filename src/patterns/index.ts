import { PatternConfig, Category } from '../types.js';
import { piiPatterns } from './pii.js';
import { credentialPatterns } from './credentials.js';
import { infrastructurePatterns } from './infrastructure.js';

export const allPatterns: PatternConfig[] = [
  ...piiPatterns,
  ...credentialPatterns,
  ...infrastructurePatterns,
];

export function getPatternsByCategory(category: Category): PatternConfig[] {
  return allPatterns.filter(p => p.category === category);
}

export function getEnabledPatterns(
  categories: Category[],
  patternFlags?: Record<string, Record<string, boolean>>
): PatternConfig[] {
  return allPatterns.filter(p => {
    if (!categories.includes(p.category)) return false;
    if (patternFlags) {
      const categoryFlags = patternFlags[p.category];
      if (categoryFlags && p.name in categoryFlags && !categoryFlags[p.name]) {
        return false;
      }
    }
    return true;
  });
}
