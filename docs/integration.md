# Integration Guide

How to use context-masker with popular coding agents.

## Claude Code

### Method 1: Shell Wrapper

```bash
# Install globally
npm install -g context-masker

# Add to ~/.bashrc or ~/.zshrc
alias claude='context-masker wrap claude'
```

### Method 2: Environment Variable

```bash
# In your shell profile
export CONTEXT_MASKER_ENABLED=1
export CONTEXT_MASKER_WRAP_COMMANDS=1

# Then use claude normally
claude
```

### Method 3: Hook Script

Create `~/.claude/hooks/pre-tool-use.sh`:

```bash
#!/bin/bash
# Mask sensitive data before tool execution
context-masker mask "$TOOL_OUTPUT"
```

---

## OpenCode

### Method 1: Library Import

```typescript
import { createContextMasker } from 'context-masker';

const masker = createContextMasker();

// Wrap LLM calls
async function callLLM(prompt: string) {
  const { masked } = masker.mask(prompt);
  const response = await llm.complete(masked);
  return masker.restore(response);
}
```

### Method 2: Plugin

```typescript
// opencode.config.ts
export default {
  plugins: [
    {
      name: 'context-masker',
      setup(api) {
        const masker = createContextMasker();
        api.on('tool-output', (output) => masker.mask(output).masked);
        api.on('llm-response', (response) => masker.restore(response));
      }
    }
  ]
};
```

---

## Cursor / Windsurf

### Method 1: .cursorrules

Add to `.cursorrules`:

```
When handling tool outputs containing sensitive data (API keys, passwords, 
database URLs, emails), use context-masker to mask them before sending to 
LLM APIs.

Example:
- Input: "Database: postgres://admin:pass@host/db"
- Masked: "Database: <<DATABASE_URL:0***>>"
```

### Method 2: VS Code Extension

Create `.vscode/settings.json`:

```json
{
  "cursor.maskSensitiveData": true,
  "cursor.maskPatterns": [
    "postgres://.*",
    "mysql://.*",
    "api_key=.*",
    "password=.*"
  ]
}
```

---

## Hermes / Windsurf

### Method 1: Agent Config

```yaml
# agent.config.yml
tools:
  - name: shell
    preUse: "context-masker mask"
    postUse: "context-masker restore"
```

### Method 2: Environment

```bash
export HERMES_MASK_ENABLED=1
export HERMES_MASKER=context-masker
```

---

## Pi / Claude CLI

### Method 1: Pipe

```bash
# Pipe tool output through masker
git status | context-masker mask | pi
```

### Method 2: Wrapper Script

```bash
#!/bin/bash
# ~/bin/pi-masked
OUTPUT=$($@)
MASKED=$(echo "$OUTPUT" | context-masker mask)
echo "$MASKED"
```

---

## Generic Integration

For any tool, you can:

1. **Install**: `npm install -g context-masker`

2. **Mask before LLM**:
   ```bash
   tool_output=$(your-command)
   masked=$(context-masker mask "$tool_output")
   # Send $masked to LLM
   ```

3. **Restore after LLM**:
   ```bash
   llm_response="..."
   restored=$(context-masker restore "$llm_response")
   # Use $restored
   ```

---

## Testing

Verify the integration works:

```bash
# Test masking
context-masker mask 'Email: user@example.com, DB: postgres://admin:pass@host/db'
# Output: Email: <<EMAIL:0***>>, DB: <<DATABASE_URL:0***>>

# Test restoration
context-masker restore 'Contact <<EMAIL:0***>> at <<DATABASE_URL:0***>>'
# Output: Contact user@example.com at postgres://admin:pass@host/db

# Test with a command
context-masker wrap env | grep -i password
# Output: (masked password values)
```
