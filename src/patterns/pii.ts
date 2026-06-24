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
  {
    name: 'ipv4',
    regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    placeholder: () => '<<IP:***>>',
    category: 'pii',
  },
  {
    name: 'credit_card',
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
    placeholder: () => '<<CREDIT_CARD:***>>',
    category: 'pii',
  },
];
