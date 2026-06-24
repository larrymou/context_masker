import { PatternConfig, Category } from '../types.js';
import { getEnabledPatterns } from '../patterns/index.js';

export interface DetectionResult {
  type: string;
  value: string;
  start: number;
  end: number;
  category: Category;
}

export function detectSensitiveData(
  text: string,
  categories: Category[] = ['pii', 'credentials', 'infrastructure']
): DetectionResult[] {
  const patterns = getEnabledPatterns(categories);
  const results: DetectionResult[] = [];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      results.push({
        type: pattern.name,
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        category: pattern.category,
      });
    }
  }

  return results.sort((a, b) => a.start - b.start);
}
