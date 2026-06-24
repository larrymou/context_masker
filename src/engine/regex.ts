import { PatternConfig, Category } from '../types.js';
import { getEnabledPatterns } from '../patterns/index.js';

export interface DetectionResult {
  type: string;
  value: string;
  placeholder: string;
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
        placeholder: pattern.placeholder(match[0]),
        start: match.index,
        end: match.index + match[0].length,
        category: pattern.category,
      });
    }
  }

  const sorted = results.sort((a, b) => a.start - b.start);

  // Remove overlapping detections, keeping higher-priority and longer matches
  const priority: Record<Category, number> = { credentials: 3, infrastructure: 2, pii: 1 };
  const filtered: DetectionResult[] = [];

  for (const detection of sorted) {
    const last = filtered[filtered.length - 1];
    if (last && detection.start < last.end) {
      // Overlap: keep the one with higher priority, or longer match
      const dominated = priority[detection.category] > priority[last.category]
        || (priority[detection.category] === priority[last.category]
            && detection.value.length > last.value.length);
      if (dominated) {
        filtered[filtered.length - 1] = detection;
      }
    } else {
      filtered.push(detection);
    }
  }

  return filtered;
}
