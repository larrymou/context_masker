export interface MaskingMetrics {
  totalCalls: number;
  totalMasked: number;
  totalRestored: number;
  detectionsByType: Record<string, number>;
  detectionsByCategory: Record<string, number>;
  lastCallTime: number;
  averageProcessingTime: number;
}

export class MaskingLogger {
  private enabled: boolean;
  private metrics: MaskingMetrics;

  constructor(enabled: boolean = false) {
    this.enabled = enabled;
    this.metrics = {
      totalCalls: 0,
      totalMasked: 0,
      totalRestored: 0,
      detectionsByType: {},
      detectionsByCategory: {},
      lastCallTime: 0,
      averageProcessingTime: 0,
    };
  }

  log(message: string, data?: unknown): void {
    if (this.enabled) {
      console.log(`[ContextMasker] ${message}`, data || '');
    }
  }

  recordMask(count: number, types: Record<string, number>, categories: Record<string, number>, duration: number): void {
    this.metrics.totalCalls++;
    this.metrics.totalMasked += count;
    this.metrics.lastCallTime = Date.now();
    
    // Update average processing time
    const total = this.metrics.averageProcessingTime * (this.metrics.totalCalls - 1) + duration;
    this.metrics.averageProcessingTime = total / this.metrics.totalCalls;
    
    // Update type counts
    for (const [type, count] of Object.entries(types)) {
      this.metrics.detectionsByType[type] = (this.metrics.detectionsByType[type] || 0) + count;
    }
    
    // Update category counts
    for (const [category, count] of Object.entries(categories)) {
      this.metrics.detectionsByCategory[category] = (this.metrics.detectionsByCategory[category] || 0) + count;
    }
    
    this.log(`Masked ${count} items in ${duration.toFixed(2)}ms`);
  }

  recordRestore(count: number, duration: number): void {
    this.metrics.totalRestored += count;
    this.log(`Restored ${count} items in ${duration.toFixed(2)}ms`);
  }

  getMetrics(): MaskingMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      totalCalls: 0,
      totalMasked: 0,
      totalRestored: 0,
      detectionsByType: {},
      detectionsByCategory: {},
      lastCallTime: 0,
      averageProcessingTime: 0,
    };
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}
