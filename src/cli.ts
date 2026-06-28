import * as fs from 'fs';
import * as path from 'path';
import { createContextMasker } from './index.js';

const SESSION_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '~', '.context-masker');
const SESSION_FILE = path.join(SESSION_DIR, 'session.json');

interface SessionData {
  mappings: Record<string, string>;
}

function loadSession(): SessionData {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
    }
  } catch {}
  return { mappings: {} };
}

function saveSession(data: SessionData): void {
  try {
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
  } catch {}
}

const masker = createContextMasker();
const session = loadSession();

const [,, command, ...args] = process.argv;

const text = args.join(' ');

switch (command) {
  case 'mask':
    const { masked, mappings } = masker.mask(text);
    
    for (const [placeholder, original] of mappings) {
      session.mappings[placeholder] = original;
    }
    saveSession(session);
    
    console.log(masked);
    break;
  case 'restore':
    masker.loadMappings(session.mappings);
    const restored = masker.restore(text);
    console.log(restored);
    break;
  case 'clear':
    session.mappings = {};
    saveSession(session);
    masker.clear();
    console.log('Session cleared');
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error('Usage: context-masker <mask|restore|clear> <text>');
    process.exit(1);
}
