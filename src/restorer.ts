import { SessionStore } from './session/store.js';

export class Restorer {
  private store: SessionStore;
  private placeholderRegex = /<<[A-Z_]+:\d+\*\*\*>>/g;

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
