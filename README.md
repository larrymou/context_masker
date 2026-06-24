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

## Supported patterns

| Category | Patterns |
|----------|----------|
| PII | Email, phone, SSN |
| Credentials | API keys, AWS secrets, passwords, OAuth tokens, JWTs |
| Infrastructure | Database URLs, Redis URLs, private keys |

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

[patterns.credentials]
api_key = true
aws_secret = true
password = true
```

## API Reference

### `createContextMasker(config?)`

Creates a new masker instance.

```ts
const masker = createContextMasker({
  enabled: ['pii', 'credentials'],  // Categories to detect
  sessionTTL: 300000                 // Session TTL in ms
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

## License

MIT
