/**
 * SISTEMA DE CACHE PARA CONTEXTO DE USUARIO
 * ==========================================
 *
 * Cache en memoria con LRU (Least Recently Used) para evitar
 * consultas repetidas a la base de datos.
 *
 * Características:
 * - Cache de contexto del usuario con TTL (Time To Live)
 * - Límite de tamaño para evitar uso excesivo de memoria
 * - Invalidación manual cuando se actualiza el contexto
 */

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  lastAccessed: number;
};

/**
 * Cache LRU simple sin dependencias externas
 */
class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize: number = 1000, ttlMs: number = 15 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /**
   * Obtiene un valor del cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Verificar si expiró
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Actualizar último acceso (para LRU)
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  /**
   * Guarda un valor en el cache
   */
  set(key: string, value: T): void {
    // Si el cache está lleno, eliminar el más viejo
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Elimina un valor del cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpia todo el cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Elimina el elemento menos recientemente usado
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Obtiene el tamaño actual del cache
   */
  get size(): number {
    return this.cache.size;
  }
}

/**
 * Cache global para contexto de usuarios
 *
 * Configuración:
 * - Máximo 1000 usuarios en cache
 * - TTL de 15 minutos por entrada
 */
const userContextCache = new SimpleCache<string>(
  1000,  // ← AJUSTAR: máximo usuarios en cache
  15 * 60 * 1000  // ← AJUSTAR: 15 minutos de TTL
);

/**
 * Obtiene el contexto del usuario desde el cache
 */
export function getCachedContext(userId: string): string | undefined {
  return userContextCache.get(userId);
}

/**
 * Guarda el contexto del usuario en el cache
 */
export function setCachedContext(userId: string, context: string): void {
  userContextCache.set(userId, context);
}

/**
 * Invalida el cache del contexto de un usuario
 * Útil cuando se actualiza el contexto del usuario
 */
export function invalidateUserContext(userId: string): void {
  userContextCache.delete(userId);
}

/**
 * Limpia todo el cache (útil para testing o mantenimiento)
 */
export function clearAllCache(): void {
  userContextCache.clear();
}

/**
 * Obtiene estadísticas del cache
 */
export function getCacheStats() {
  return {
    size: userContextCache.size,
    maxSize: 1000,
    ttlMinutes: 15,
  };
}
