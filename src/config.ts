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
