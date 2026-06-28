import { createContextMasker } from './index.js';

const masker = createContextMasker();
const session: Record<string, string> = {};

const [,, command, ...args] = process.argv;

const text = args.join(' ');

switch (command) {
  case 'mask':
    const { masked, mappings } = masker.mask(text);
    
    for (const [placeholder, original] of mappings) {
      session[placeholder] = original;
    }
    
    console.log(masked);
    break;
  case 'restore':
    masker.loadMappings(session);
    const restored = masker.restore(text);
    console.log(restored);
    break;
  case 'clear':
    Object.keys(session).forEach(k => delete session[k]);
    masker.clear();
    console.log('Session cleared');
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error('Usage: context-masker <mask|restore|clear> <text>');
    process.exit(1);
}
