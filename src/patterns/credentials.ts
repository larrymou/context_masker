import { PatternConfig } from '../types.js';

export const credentialPatterns: PatternConfig[] = [
  {
    name: 'api_key',
    regex: /\b(?:api[_-]?key|apikey)[\s:=]+["']?[a-zA-Z0-9._\-/+=]{20,}["']?/gi,
    placeholder: () => '<<API_KEY:***>>',
    category: 'credentials',
  },
  {
    name: 'aws_secret',
    regex: /\b(?:aws[_-]?secret[_-]?access[_-]?key)[\s:=]+["']?[a-zA-Z0-9/+=]{40}["']?/gi,
    placeholder: () => '<<AWS_SECRET:***>>',
    category: 'credentials',
  },
  {
    name: 'password',
    regex: /\b(?:password|passwd|pwd|secret)[\s:=]+["']?[^\s"']{8,}["']?/gi,
    placeholder: () => '<<PASSWORD:***>>',
    category: 'credentials',
  },
  {
    name: 'oauth_token',
    regex: /\b(?:oauth[_-]?token|access[_-]?token)[\s:=]+["']?[a-zA-Z0-9._-]{20,}["']?/gi,
    placeholder: () => '<<OAUTH:***>>',
    category: 'credentials',
  },
  {
    name: 'jwt',
    regex: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]+/g,
    placeholder: () => '<<JWT:***>>',
    category: 'credentials',
  },
  {
    name: 'github_token',
    regex: /\b(gh[pousr]_[A-Za-z0-9_]{36,}|github_pat_[A-Za-z0-9_]{22,})/g,
    placeholder: () => '<<GITHUB_TOKEN:***>>',
    category: 'credentials',
  },
  {
    name: 'stripe_key',
    regex: /\b(rk_(live|test)_[A-Za-z0-9]{24,}|sk_(live|test)_[A-Za-z0-9]{24,}|pk_(live|test)_[A-Za-z0-9]{24,})/g,
    placeholder: () => '<<STRIPE_KEY:***>>',
    category: 'credentials',
  },
  {
    name: 'slack_token',
    regex: /\b(xox[bpoa]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,})/g,
    placeholder: () => '<<SLACK_TOKEN:***>>',
    category: 'credentials',
  },
  {
    name: 'private_key',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    placeholder: () => '<<PRIVATE_KEY:***>>',
    category: 'credentials',
  },
];
