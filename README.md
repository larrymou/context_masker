# Context Masker

A bidirectional reversible desensitization middleware for coding agents.

## What it does

Context Masker intercepts sensitive data before LLM API calls and restores it after, preventing sensitive information leakage when using external LLM APIs.

```
Agent Tool Output → [Mask] → LLM API → [Restore] → Agent
```

## Features

- **Regex-based detection** - Fast, deterministic detection of sensitive data
- **Informative placeholders** - LLM sees `<<EMAIL:***>>` instead of actual emails
- **Reversible masking** - Original values restored in LLM responses
- **CLI & Library** - Use as command-line tool or import as TypeScript library
- **Configurable categories** - Enable/disable PII, credentials, infrastructure patterns
- **Session-scoped storage** - TTL-based mapping expiration
- **Tool integration** - Works with Claude Code, OpenCode, Cursor, Hermes, and more
- **Logging & metrics** - Track masking statistics and performance
- **Custom patterns** - Add your own detection rules

## Supported patterns

| Category | Patterns |
|----------|----------|
| PII | Email, phone, SSN, IPv4, credit card |
| Credentials | API keys, AWS secrets, passwords, OAuth tokens, JWTs, GitHub/Stripe/Slack tokens |
| Infrastructure | Database URLs, Redis URLs, private keys (RSA, EC, DSA, OpenSSH) |

## Installation

```bash
npm install context-masker
```

## Quick start

### As a library

```ts
import { createContextMasker } from 'context-masker';

const masker = createContextMasker();

// Mask before sending to LLM
const { masked } = masker.mask('Email: user@example.com, DB: postgres://admin:pass@host/db');
// masked: "Email: <<EMAIL:***>>, DB: <<DB_URL:***>>"

// Restore after receiving LLM response
const restored = masker.restore('Contact <<EMAIL:***>> at <<DB_URL:***>>');
// restored: "Contact user@example.com at postgres://admin:pass@host/db"
```

### As a CLI

```bash
# Mask sensitive data
context-masker mask 'Email: user@example.com, DB: postgres://admin:pass@host/db'
# Output: Email: <<EMAIL:***>>, DB: <<DB_URL:***>>

# Restore placeholders
context-masker restore 'Contact <<EMAIL:***>> at <<DB_URL:***>>'
# Output: Contact user@example.com at postgres://admin:pass@host/db

# Wrap a command to auto-mask output
context-masker wrap env | grep -i password

# Clear session
context-masker clear
```

## Tool integration

### Claude Code / OpenCode

```bash
# Add to ~/.bashrc or ~/.zshrc
alias claude='context-masker wrap claude'
```

### Cursor / Windsurf

Add to `.cursorrules`:

```
When handling tool outputs containing sensitive data (API keys, passwords, 
database URLs, emails), use context-masker to mask them before sending to 
LLM APIs.
```

### Hermes / Windsurf

```yaml
# agent.config.yml
tools:
  - name: shell
    preUse: "context-masker mask"
    postUse: "context-masker restore"
```

### Generic integration

```bash
# Pipe tool output through masker
tool_output=$(your-command)
masked=$(context-masker mask "$tool_output")
# Send $masked to LLM
```

## Configuration

Create `config/default.toml`:

```toml
enabled = ["pii", "credentials", "infrastructure"]
sessionTTL = 300000  # 5 minutes

[patterns.pii]
email = true
phone = true
ssn = true
ipv4 = true
credit_card = true

[patterns.credentials]
api_key = true
aws_secret = true
password = true
github_token = true
stripe_key = true
slack_token = true
```

## API Reference

### `createContextMasker(config?)`

Creates a new masker instance.

```ts
const masker = createContextMasker({
  enabled: ['pii', 'credentials'],  // Categories to detect
  sessionTTL: 300000,               // Session TTL in ms
  logging: true,                    // Enable debug logging
  customPatterns: [                 // Add custom patterns
    {
      name: 'custom_id',
      regex: '\\bID-[0-9]{6}\\b',
      placeholder: '<<CUSTOM_ID:***>>',
      category: 'pii',
    }
  ]
});
```

### `masker.mask(text)`

Masks sensitive data in text.

```ts
const { masked, mappings } = masker.mask(text);
// masked: string - Text with placeholders
// mappings: Map<string, string> - Placeholder to original value mapping
```

### `masker.restore(text)`

Restores placeholders to original values.

```ts
const restored = masker.restore(text);
```

### `masker.clear()`

Clears the session store.

```ts
masker.clear();
```

### `masker.getMetrics()`

Returns masking statistics.

```ts
const metrics = masker.getMetrics();
// {
//   totalCalls: 10,
//   totalMasked: 25,
//   totalRestored: 20,
//   detectionsByType: { email: 10, api_key: 8, ... },
//   averageProcessingTime: 0.5
// }
```

### `masker.addCustomPattern(pattern)`

Adds a custom detection pattern.

```ts
masker.addCustomPattern({
  name: 'internal_id',
  regex: '\\bINT-[0-9]{8}\\b',
  placeholder: '<<INTERNAL_ID:***>>',
  category: 'pii',
});
```

### `masker.removeCustomPattern(name)`

Removes a custom pattern by name.

```ts
masker.removeCustomPattern('internal_id');
```

### `masker.setLogging(enabled)`

Enable or disable debug logging.

```ts
masker.setLogging(true);
```

### `masker.resetMetrics()`

Reset all metrics to zero.

```ts
masker.resetMetrics();
```

## License

MIT
