import { PatternConfig } from '../types.js';

export const piiPatterns: PatternConfig[] = [
  {
    name: 'email',
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    placeholder: () => '<<EMAIL:***>>',
    category: 'pii',
  },
  {
    name: 'phone',
    regex: /(?:\+?1[-. ]?)?(?:\(?\d{3}\)?[-. ]?)?\d{3}[-. ]?\d{4}/g,
    placeholder: () => '<<PHONE:***>>',
    category: 'pii',
  },
  {
    name: 'ssn',
    regex: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
    placeholder: () => '<<SSN:***>>',
    category: 'pii',
  },
];
