/**
 * Cache utilities for improved performance
 */

import { logger } from './logger';
import { CACHE_CONFIG } from './constants';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
}

/**
 * Generic in-memory cache implementation
 */
export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
  };

  constructor(
    private maxSize: number = CACHE_CONFIG.MAX_CACHE_SIZE,
    private defaultTtl: number = CACHE_CONFIG.SEARCH_EXPIRY_TIME
  ) {}

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      this.updateSize();
      return undefined;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTtl);
    
    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      expiresAt,
    });

    this.stats.sets++;
    this.updateSize();
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.updateSize();
    }
    return deleted;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.deletes++;
      this.updateSize();
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.deletes += this.stats.size;
    this.updateSize();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache hit ratio
   */
  getHitRatio(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.stats.deletes += expiredCount;
      this.updateSize();
      logger.debug('Cache cleanup completed', { expiredCount, newSize: this.cache.size });
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toEvict = Math.ceil(this.maxSize * CACHE_CONFIG.CLEANUP_PERCENTAGE);
    
    for (let i = 0; i < toEvict && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.deletes++;
    }

    this.updateSize();
    logger.debug('Cache eviction completed', { evicted: toEvict, newSize: this.cache.size });
  }

  /**
   * Update cache size in stats
   */
  private updateSize(): void {
    this.stats.size = this.cache.size;
  }
}

/**
 * Cache decorator for functions
 */
export function cached<T extends (...args: any[]) => any>(
  cache: MemoryCache,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: Parameters<T>): ReturnType<T> {
      const key = keyGenerator(...args);
      
      // Try to get from cache
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }

      // Execute original method
      const result = originalMethod.apply(this, args);
      
      // Cache the result
      cache.set(key, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}

/**
 * Async cache decorator
 */
export function cachedAsync<T extends (...args: any[]) => Promise<any>>(
  cache: MemoryCache,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
      const key = keyGenerator(...args);
      
      // Try to get from cache
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      cache.set(key, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}

/**
 * Create cache key from object
 */
export function createCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
}

/**
 * Global cache instances
 */
export const searchCache = new MemoryCache<any>(1000, 5 * 60 * 1000); // 5 minutes
export const productCache = new MemoryCache<any>(500, 10 * 60 * 1000); // 10 minutes
export const userCache = new MemoryCache<any>(200, 15 * 60 * 1000); // 15 minutes

/**
 * Setup cache cleanup intervals
 */
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    searchCache.cleanup();
    productCache.cleanup();
    userCache.cleanup();
  }, CACHE_CONFIG.CLEANUP_INTERVAL);
}

/**
 * Get all cache statistics
 */
export function getAllCacheStats() {
  return {
    search: searchCache.getStats(),
    product: productCache.getStats(),
    user: userCache.getStats(),
  };
}
