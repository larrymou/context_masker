# Context Masker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bidirectional reversible desensitization middleware that masks sensitive data before LLM API calls and restores it after, using regex-based detection and informative placeholders.

**Architecture:** Hook-based middleware with three components: RegexEngine (detection), Masker (pre-LLM), Restorer (post-LLM). Session-scoped mapping stores placeholder-to-value pairs. Configurable via TOML.

**Tech Stack:** TypeScript, Vitest (testing), TOML (config), Node.js

---

## File Structure

```
context_masker/
├── src/
│   ├── index.ts              # Main entry point, exports public API
│   ├── types.ts              # TypeScript interfaces and types
│   ├── config.ts             # TOML config loader and validator
│   ├── patterns/
│   │   ├── index.ts          # Pattern registry
│   │   ├── pii.ts            # Email, phone, name patterns
│   │   ├── credentials.ts    # API keys, tokens, passwords
│   │   └── infrastructure.ts # DB URLs, Redis URLs
│   ├── engine/
│   │   ├── regex.ts          # Regex detection engine
│   │   └── matcher.ts        # Pattern matching coordinator
│   ├── session/
│   │   ├── store.ts          # Session mapping store
│   │   └── ttl.ts            # TTL-based expiration
│   ├── masker.ts             # Pre-LLM masking logic
│   └── restorer.ts           # Post-LLM restoration logic
├── config/
│   └── default.toml          # Default configuration
├── tests/
│   ├── engine/
│   │   ├── regex.test.ts
│   │   └── matcher.test.ts
│   ├── session/
│   │   ├── store.test.ts
│   │   └── ttl.test.ts
│   ├── masker.test.ts
│   ├── restorer.test.ts
│   └── integration.test.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

### Task 1: Project Setup

**Covers:** [S8]

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Initialize npm project**

```bash
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install toml
npm install -D typescript vitest @types/node
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

- [ ] **Step 5: Add scripts to package.json**

```json
{
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit"
  }
}
```

- [ ] **Step 6: Verify setup**

```bash
npm run build
npm run test
```

Expected: Both commands succeed (no files to compile/test yet)

- [ ] **Step 7: Commit**

```bash
git init
git add package.json package-lock.json tsconfig.json vitest.config.ts
git commit -m "chore: initialize project with TypeScript and Vitest"
```

---

### Task 2: Define TypeScript Types

**Covers:** [S2, S4, S5]

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create types.ts**

```ts
export type Category = 'pii' | 'credentials' | 'infrastructure';

export interface PatternConfig {
  name: string;
  regex: RegExp;
  placeholder: (match: string) => string;
  category: Category;
}

export interface MaskerConfig {
  enabled: Category[];
  patterns: Record<string, string>;
  sessionTTL: number;
}

export interface MaskResult {
  masked: string;
  mappings: Map<string, string>;
}

export interface SessionEntry {
  placeholder: string;
  original: string;
  timestamp: number;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: Success (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: define TypeScript interfaces for masker"
```

---

### Task 3: Create Pattern Registry

**Covers:** [S3, S4]

**Files:**
- Create: `src/patterns/index.ts`
- Create: `src/patterns/pii.ts`
- Create: `src/patterns/credentials.ts`
- Create: `src/patterns/infrastructure.ts`

- [ ] **Step 1: Create PII patterns**

```ts
// src/patterns/pii.ts
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
```

- [ ] **Step 2: Create credential patterns**

```ts
// src/patterns/credentials.ts
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
```

- [ ] **Step 3: Create infrastructure patterns**

```ts
// src/patterns/infrastructure.ts
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
```

- [ ] **Step 4: Create pattern registry**

```ts
// src/patterns/index.ts
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
```

- [ ] **Step 5: Verify compilation**

```bash
npm run build
```

Expected: Success

- [ ] **Step 6: Commit**

```bash
git add src/patterns/
git commit -m "feat: add regex patterns for PII, credentials, and infrastructure"
```

---

### Task 4: Create Regex Detection Engine

**Covers:** [S4, S7]

**Files:**
- Create: `src/engine/regex.ts`
- Test: `tests/engine/regex.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/engine/regex.test.ts
import { describe, it, expect } from 'vitest';
import { detectSensitiveData } from '../../src/engine/regex.js';

describe('detectSensitiveData', () => {
  it('should detect email addresses', () => {
    const text = 'Contact me at user@example.com';
    const results = detectSensitiveData(text);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('email');
    expect(results[0].value).toBe('user@example.com');
  });

  it('should detect API keys', () => {
    const text = 'api_key=sk-1234567890abcdef1234567890';
    const results = detectSensitiveData(text);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('api_key');
  });

  it('should detect database URLs', () => {
    const text = 'DATABASE_URL=postgres://user:pass@host:5432/db';
    const results = detectSensitiveData(text);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('database_url');
  });

  it('should detect multiple sensitive items', () => {
    const text = 'Email: test@test.com, API: sk-1234567890abcdef1234567890';
    const results = detectSensitiveData(text);
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it('should return empty array for clean text', () => {
    const text = 'This is a normal sentence without sensitive data.';
    const results = detectSensitiveData(text);
    expect(results).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- tests/engine/regex.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement regex engine**

```ts
// src/engine/regex.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- tests/engine/regex.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/regex.ts tests/engine/regex.test.ts
git commit -m "feat: implement regex detection engine with tests"
```

---

### Task 5: Create Session Store

**Covers:** [S4, S5]

**Files:**
- Create: `src/session/store.ts`
- Create: `src/session/ttl.ts`
- Test: `tests/session/store.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/session/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SessionStore } from '../../src/session/store.js';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore(60000); // 60s TTL
  });

  it('should store and retrieve mappings', () => {
    store.set('<<EMAIL:***>>', 'user@example.com');
    expect(store.get('<<EMAIL:***>>')).toBe('user@example.com');
  });

  it('should return null for unknown placeholders', () => {
    expect(store.get('<<UNKNOWN:***>>')).toBeNull();
  });

  it('should expire entries after TTL', async () => {
    const shortStore = new SessionStore(100); // 100ms TTL
    shortStore.set('<<EMAIL:***>>', 'user@example.com');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(shortStore.get('<<EMAIL:***>>')).toBeNull();
  });

  it('should clear all entries', () => {
    store.set('<<EMAIL:***>>', 'user@example.com');
    store.set('<<PHONE:***>>', '123-456-7890');
    store.clear();
    
    expect(store.get('<<EMAIL:***>>')).toBeNull();
    expect(store.get('<<PHONE:***>>')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- tests/session/store.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement TTL helper**

```ts
// src/session/ttl.ts
export class TTLMap<K, V> {
  private map = new Map<K, { value: V; expires: number }>();
  private ttl: number;

  constructor(ttlMs: number) {
    this.ttl = ttlMs;
  }

  set(key: K, value: V): void {
    this.map.set(key, {
      value,
      expires: Date.now() + this.ttl,
    });
  }

  get(key: K): V | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.map.delete(key);
      return null;
    }
    
    return entry.value;
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}
```

- [ ] **Step 4: Implement session store**

```ts
// src/session/store.ts
import { TTLMap } from './ttl.js';

export class SessionStore {
  private store: TTLMap<string, string>;

  constructor(ttlMs: number = 300000) { // 5 minutes default
    this.store = new TTLMap(ttlMs);
  }

  set(placeholder: string, original: string): void {
    this.store.set(placeholder, original);
  }

  get(placeholder: string): string | null {
    return this.store.get(placeholder);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm run test -- tests/session/store.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/session/ tests/session/
git commit -m "feat: implement session store with TTL expiration"
```

---

### Task 6: Create Masker

**Covers:** [S2, S3, S5]

**Files:**
- Create: `src/masker.ts`
- Test: `tests/masker.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/masker.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Masker } from '../src/masker.js';

describe('Masker', () => {
  let masker: Masker;

  beforeEach(() => {
    masker = new Masker();
  });

  it('should mask email addresses with placeholders', () => {
    const text = 'Contact user@example.com for info';
    const result = masker.mask(text);
    
    expect(result.masked).toContain('<<EMAIL:***>>');
    expect(result.masked).not.toContain('user@example.com');
    expect(result.mappings.size).toBe(1);
  });

  it('should preserve original in mapping', () => {
    const text = 'Email: test@company.com';
    const result = masker.mask(text);
    
    const original = result.mappings.get('<<EMAIL:***>>');
    expect(original).toBe('test@company.com');
  });

  it('should mask multiple sensitive items', () => {
    const text = 'Email: a@b.com, API: sk-1234567890abcdef1234567890';
    const result = masker.mask(text);
    
    expect(result.mappings.size).toBeGreaterThanOrEqual(2);
  });

  it('should not mask clean text', () => {
    const text = 'This is safe text';
    const result = masker.mask(text);
    
    expect(result.masked).toBe(text);
    expect(result.mappings.size).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- tests/masker.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement masker**

```ts
// src/masker.ts
import { Category, MaskResult, MaskerConfig } from './types.js';
import { detectSensitiveData, DetectionResult } from './engine/regex.js';
import { SessionStore } from './session/store.js';
import { getEnabledPatterns } from './patterns/index.js';

export class Masker {
  private store: SessionStore;
  private categories: Category[];
  private counter = new Map<string, number>();

  constructor(config?: Partial<MaskerConfig>) {
    this.store = new SessionStore(config?.sessionTTL ?? 300000);
    this.categories = config?.enabled ?? ['pii', 'credentials', 'infrastructure'];
  }

  mask(text: string): MaskResult {
    const detections = detectSensitiveData(text, this.categories);
    const mappings = new Map<string, string>();
    let masked = text;

    // Process in reverse order to maintain string positions
    for (let i = detections.length - 1; i >= 0; i--) {
      const detection = detections[i];
      const placeholder = this.createPlaceholder(detection);
      
      masked = masked.slice(0, detection.start) + placeholder + masked.slice(detection.end);
      mappings.set(placeholder, detection.value);
      this.store.set(placeholder, detection.value);
    }

    return { masked, mappings };
  }

  private createPlaceholder(detection: DetectionResult): string {
    const count = (this.counter.get(detection.type) ?? 0) + 1;
    this.counter.set(detection.type, count);
    return `<<${detection.type.toUpperCase()}:***>>`;
  }

  getOriginal(placeholder: string): string | null {
    return this.store.get(placeholder);
  }

  clear(): void {
    this.store.clear();
    this.counter.clear();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- tests/masker.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/masker.ts tests/masker.test.ts
git commit -m "feat: implement masker with session-scoped mapping"
```

---

### Task 7: Create Restorer

**Covers:** [S2, S5]

**Files:**
- Create: `src/restorer.ts`
- Test: `tests/restorer.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/restorer.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Restorer } from '../src/restorer.js';
import { SessionStore } from '../src/session/store.js';

describe('Restorer', () => {
  let store: SessionStore;
  let restorer: Restorer;

  beforeEach(() => {
    store = new SessionStore(60000);
    restorer = new Restorer(store);
    
    // Setup test mappings
    store.set('<<EMAIL:***>>', 'user@example.com');
    store.set('<<API_KEY:***>>', 'sk-1234567890abcdef');
  });

  it('should restore placeholders to original values', () => {
    const text = 'Email: <<EMAIL:***>>, Key: <<API_KEY:***>>';
    const restored = restorer.restore(text);
    
    expect(restored).toBe('Email: user@example.com, Key: sk-1234567890abcdef');
  });

  it('should leave non-placeholder text unchanged', () => {
    const text = 'This has no placeholders';
    const restored = restorer.restore(text);
    
    expect(restored).toBe(text);
  });

  it('should handle multiple same placeholders', () => {
    store.set('<<PHONE:***>>', '555-1234');
    const text = 'Call <<PHONE:***>> or <<PHONE:***>>';
    const restored = restorer.restore(text);
    
    expect(restored).toBe('Call 555-1234 or 555-1234');
  });

  it('should leave unknown placeholders unchanged', () => {
    const text = '<<UNKNOWN:***>>';
    const restored = restorer.restore(text);
    
    expect(restored).toBe(text);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- tests/restorer.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement restorer**

```ts
// src/restorer.ts
import { SessionStore } from './session/store.js';

export class Restorer {
  private store: SessionStore;
  private placeholderRegex = /<<[A-Z_]+:\*\*\*>>/g;

  constructor(store: SessionStore) {
    this.store = store;
  }

  restore(text: string): string {
    return text.replace(this.placeholderRegex, (match) => {
      const original = this.store.get(match);
      return original ?? match;
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- tests/restorer.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/restorer.ts tests/restorer.test.ts
git commit -m "feat: implement restorer to replace placeholders with originals"
```

---

### Task 8: Create Main Entry Point

**Covers:** [S2, S5, S6]

**Files:**
- Create: `src/index.ts`
- Test: `tests/integration.test.ts`

- [ ] **Step 1: Write failing integration test**

```ts
// tests/integration.test.ts
import { describe, it, expect } from 'vitest';
import { createContextMasker } from '../src/index.js';

describe('Context Masker Integration', () => {
  it('should mask and restore in full workflow', () => {
    const masker = createContextMasker();
    
    const toolOutput = `
      Database: postgres://admin:secret123@db.example.com:5432/mydb
      Contact: support@company.com
      API Key: api_key=sk-abcdef1234567890abcdef12
    `;
    
    // Mask before sending to LLM
    const { masked } = masker.mask(toolOutput);
    
    expect(masked).toContain('<<DB_URL:***>>');
    expect(masked).toContain('<<EMAIL:***>>');
    expect(masked).toContain('<<API_KEY:***>>');
    expect(masked).not.toContain('secret123');
    expect(masked).not.toContain('support@company.com');
    
    // Restore after receiving LLM response
    const llmResponse = `I found the database at <<DB_URL:***>> and emailed <<EMAIL:***>>`;
    const restored = masker.restore(llmResponse);
    
    expect(restored).toContain('postgres://admin:secret123@db.example.com:5432/mydb');
    expect(restored).toContain('support@company.com');
  });

  it('should handle nested sensitive data', () => {
    const masker = createContextMasker();
    
    const input = 'Config: {"db": "mysql://root:pass@localhost/db", "email": "admin@test.com"}';
    const { masked } = masker.mask(input);
    
    expect(masked).toContain('<<DB_URL:***>>');
    expect(masked).toContain('<<EMAIL:***>>');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- tests/integration.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement main entry point**

```ts
// src/index.ts
import { MaskerConfig, Category } from './types.js';
import { Masker } from './masker.js';
import { Restorer } from './restorer.js';
import { SessionStore } from './session/store.js';

export interface ContextMasker {
  mask: (text: string) => { masked: string; mappings: Map<string, string> };
  restore: (text: string) => string;
  clear: () => void;
}

export function createContextMasker(config?: Partial<MaskerConfig>): ContextMasker {
  const store = new SessionStore(config?.sessionTTL ?? 300000);
  const masker = new Masker(config);
  const restorer = new Restorer(store);

  return {
    mask: (text: string) => {
      const result = masker.mask(text);
      // Sync mappings to shared store
      for (const [placeholder, original] of result.mappings) {
        store.set(placeholder, original);
      }
      return result;
    },
    restore: (text: string) => restorer.restore(text),
    clear: () => {
      masker.clear();
      store.clear();
    },
  };
}

export type { Category, MaskerConfig };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- tests/integration.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/index.ts tests/integration.test.ts
git commit -m "feat: add main entry point with mask/restore API"
```

---

### Task 9: Add Configuration Support

**Covers:** [S5]

**Files:**
- Create: `config/default.toml`
- Create: `src/config.ts`
- Test: `tests/config.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/config.test.ts
import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('should load default config', () => {
    const config = loadConfig();
    expect(config.enabled).toContain('pii');
    expect(config.enabled).toContain('credentials');
    expect(config.enabled).toContain('infrastructure');
    expect(config.sessionTTL).toBe(300000);
  });

  it('should merge with custom config', () => {
    const config = loadConfig({ sessionTTL: 60000 });
    expect(config.sessionTTL).toBe(60000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- tests/config.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Create default config**

```toml
# config/default.toml
enabled = ["pii", "credentials", "infrastructure"]

sessionTTL = 300000  # 5 minutes

[patterns.pii]
email = true
phone = true
ssn = true

[patterns.credentials]
api_key = true
aws_secret = true
password = true
oauth_token = true
jwt = true

[patterns.infrastructure]
database_url = true
redis_url = true
private_key = true
```

- [ ] **Step 4: Implement config loader**

```ts
// src/config.ts
import * as fs from 'fs';
import * as path from 'path';
import * as toml from 'toml';
import { MaskerConfig, Category } from './types.js';

const defaultConfigPath = path.join(process.cwd(), 'config', 'default.toml');

export function loadConfig(overrides?: Partial<MaskerConfig>): MaskerConfig {
  let fileConfig: Record<string, unknown> = {};
  
  if (fs.existsSync(defaultConfigPath)) {
    const content = fs.readFileSync(defaultConfigPath, 'utf-8');
    fileConfig = toml.parse(content);
  }

  const config: MaskerConfig = {
    enabled: (fileConfig.enabled as Category[]) ?? ['pii', 'credentials', 'infrastructure'],
    patterns: (fileConfig.patterns as Record<string, string>) ?? {},
    sessionTTL: (fileConfig.sessionTTL as number) ?? 300000,
  };

  return { ...config, ...overrides };
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm run test -- tests/config.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add config/default.toml src/config.ts tests/config.test.ts
git commit -m "feat: add TOML configuration support"
```

---

### Task 10: Final Verification

**Covers:** [S8]

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

```bash
npm run test
```

Expected: All tests pass

- [ ] **Step 2: Run TypeScript compilation**

```bash
npm run build
```

Expected: No errors

- [ ] **Step 3: Run lint check**

```bash
npm run lint
```

Expected: No errors

- [ ] **Step 4: Test CLI usage**

```bash
node -e "
const { createContextMasker } = require('./dist/index.js');
const masker = createContextMasker();
const result = masker.mask('Email: test@example.com, DB: postgres://user:pass@host/db');
console.log('Masked:', result.masked);
console.log('Restored:', masker.restore(result.masked));
"
```

Expected: Shows masked text with placeholders, then restored with originals

- [ ] **Step 5: Commit final state**

```bash
git add -A
git commit -m "chore: complete context masker v1 implementation"
```

---

## Self-Review Checklist

- [x] All spec sections covered (S1-S8)
- [x] No placeholders (TBD, TODO, etc.)
- [x] Type consistency across tasks
- [x] Complete code in every step
- [x] Exact file paths
- [x] Exact commands with expected output
