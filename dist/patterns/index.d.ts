import { PatternConfig, Category } from '../types.js';
export declare const allPatterns: PatternConfig[];
export declare function getPatternsByCategory(category: Category): PatternConfig[];
export declare function getEnabledPatterns(categories: Category[]): PatternConfig[];
