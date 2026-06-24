import { MaskerConfig, Category } from './types.js';
export interface ContextMasker {
    mask: (text: string) => {
        masked: string;
        mappings: Map<string, string>;
    };
    restore: (text: string) => string;
    clear: () => void;
}
export declare function createContextMasker(config?: Partial<MaskerConfig>): ContextMasker;
export type { Category, MaskerConfig };
