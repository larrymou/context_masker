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
- **Configurable categories** - Enable/disable PII, credentials, infrastructure patterns
- **Session-scoped storage** - TTL-based mapping expiration
- **TypeScript** - Full type safety

## Supported patterns

| Category | Patterns |
|----------|----------|
| PII | Email, phone, SSN |
| Credentials | API keys, AWS secrets, passwords, OAuth tokens, JWTs |
| Infrastructure | Database URLs, Redis URLs, private keys |

## Quick start

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

## Installation

```bash
npm install context-masker
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

## License

MIT
