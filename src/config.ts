import * as fs from 'fs';
import * as path from 'path';
import * as toml from 'toml';
import { MaskerConfig, Category } from './types.js';

const defaultConfigPath = path.join(__dirname, '..', 'config', 'default.toml');

export function loadConfig(overrides?: Partial<MaskerConfig>): MaskerConfig {
  let fileConfig: Record<string, unknown> = {};
  
  if (fs.existsSync(defaultConfigPath)) {
    const content = fs.readFileSync(defaultConfigPath, 'utf-8');
    fileConfig = toml.parse(content);
  }

  const rawPatterns = fileConfig.patterns as Record<string, Record<string, unknown>> | undefined;
  const patternFlags: Record<string, Record<string, boolean>> | undefined = rawPatterns
    ? Object.fromEntries(
        Object.entries(rawPatterns).map(([cat, flags]) => [
          cat,
          Object.fromEntries(
            Object.entries(flags).map(([name, val]) => [name, val === true])
          ),
        ])
      )
    : undefined;

  const config: MaskerConfig = {
    enabled: (fileConfig.enabled as Category[]) ?? ['pii', 'credentials', 'infrastructure'],
    patternFlags,
    sessionTTL: (fileConfig.sessionTTL as number) ?? 300000,
  };

  return { ...config, ...overrides };
}
