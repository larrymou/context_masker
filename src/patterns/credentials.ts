import { PatternConfig } from '../types.js';

export const credentialPatterns: PatternConfig[] = [
  {
    name: 'api_key',
    regex: /\b(?:api[_-]?key|apikey)[\s:=]+["']?[a-zA-Z0-9]{20,}["']?/gi,
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
    regex: /\b(?:password|passwd|pwd)[\s:=]+["']?[^\s"']{8,}["']?/gi,
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
];
