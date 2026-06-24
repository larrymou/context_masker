import * as fs from 'fs';
import * as path from 'path';
import { createContextMasker } from './index.js';

const SESSION_FILE = path.join(process.env.HOME || '~', '.context-masker-session.json');

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
  fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2));
}

const masker = createContextMasker();
const session = loadSession();

// Restore previous mappings
for (const [placeholder, original] of Object.entries(session.mappings)) {
  // These will be used by the restorer
}

const [,, command, ...args] = process.argv;

const text = args.join(' ');

switch (command) {
  case 'mask':
    const { masked, mappings } = masker.mask(text);
    
    // Save new mappings to session
    for (const [placeholder, original] of mappings) {
      session.mappings[placeholder] = original;
    }
    saveSession(session);
    
    console.log(masked);
    break;
  case 'restore':
    // Temporarily populate the masker with saved mappings
    for (const [placeholder, original] of Object.entries(session.mappings)) {
      masker.mask(`${placeholder}: ${original}`);
    }
    
    const restored = masker.restore(text);
    console.log(restored);
    break;
  case 'clear':
    saveSession({ mappings: {} });
    console.log('Session cleared');
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error('Usage: context-masker <mask|restore|clear> <text>');
    process.exit(1);
}
