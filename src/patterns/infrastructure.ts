import { PatternConfig } from '../types.js';

export const infrastructurePatterns: PatternConfig[] = [
  {
    name: 'database_url',
    regex: /\b(?:postgres(?:ql)?|mysql|mongodb|redis):\/\/[^\s"']+/gi,
    category: 'infrastructure',
  },
];
