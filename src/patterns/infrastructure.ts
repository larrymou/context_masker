import { PatternConfig } from '../types.js';

export const infrastructurePatterns: PatternConfig[] = [
  {
    name: 'database_url',
    regex: /\b(?:postgres(?:ql)?|mysql|mongodb|redis):\/\/[^\s"']+/gi,
    placeholder: () => '<<DB_URL:***>>',
    category: 'infrastructure',
  },
  {
    name: 'redis_url',
    regex: /\bredis:\/\/[^\s"']+/gi,
    placeholder: () => '<<REDIS:***>>',
    category: 'infrastructure',
  },
  {
    name: 'private_key',
    regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC )?PRIVATE KEY-----/g,
    placeholder: () => '<<PRIVATE_KEY:***>>',
    category: 'infrastructure',
  },
];
