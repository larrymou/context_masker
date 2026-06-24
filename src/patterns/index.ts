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

export function getEnabledPatterns(categories: Category[]): PatternConfig[] {
  return allPatterns.filter(p => categories.includes(p.category));
}
