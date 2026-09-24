import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRatio: number;
}

/**
 * In-memory LRU cache with TTL for legal clause analyses and queries.
 * Keyed by SHA-256 hash of normalized text + task + prompt version + language.
 */
class AnalysisCache {
  private cache: LRUCache<string, Record<string, unknown>>;
  private hits = 0;
  private misses = 0;

  constructor(maxItems = 1000, ttlMs = 30 * 60 * 1000) {
    this.cache = new LRUCache<string, Record<string, unknown>>({
      max: maxItems,
      ttl: ttlMs,
    });
  }

  /**
   * Generates a deterministic SHA-256 hash key.
   */
  public generateKey(text: string, task: string, version = 'v1', lang = 'en'): string {
    const payload = `${task}:${version}:${lang}:${text.trim()}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Retrieves an item from the cache.
   */
  public get<T>(key: string): T | undefined {
    const item = this.cache.get(key) as unknown as T | undefined;
    if (item !== undefined) {
      this.hits++;
      return item;
    }
    this.misses++;
    return undefined;
  }

  /**
   * Stores an item in the cache with optional custom TTL.
   */
  public set<T>(key: string, value: T, ttlMs?: number): void {
    this.cache.set(key, value as unknown as Record<string, unknown>, { ttl: ttlMs });
  }

  /**
   * Clears all cache entries.
   */
  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Retrieves current cache statistics.
   */
  public getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRatio: total > 0 ? Number((this.hits / total).toFixed(3)) : 0,
    };
  }
}

export const analysisCache = new AnalysisCache();
