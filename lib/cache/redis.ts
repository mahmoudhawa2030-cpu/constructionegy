/**
 * Thin Redis client wrapper.
 *
 * Today: no-op (REDIS_URL not set) — every get() returns null, set() is a no-op.
 * Tomorrow: set REDIS_URL in .env.local (Upstash for now, self-hosted on Hetzner later).
 *
 * Usage:
 *   const cache = getRedisClient();
 *   const cached = await cache?.get("feed:userId");
 *   if (cached) return JSON.parse(cached);
 *   ...compute...
 *   await cache?.set("feed:userId", JSON.stringify(result), { ex: 300 }); // 5 min TTL
 *
 * Migration to Hetzner: just change REDIS_URL from Upstash URL to redis://localhost:6379
 */

export type RedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, opts?: { ex?: number }) => Promise<void>;
  del: (key: string) => Promise<void>;
};

let _client: RedisClient | null | undefined = undefined;

export function getRedisClient(): RedisClient | null {
  if (_client !== undefined) return _client;

  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    _client = null;
    return null;
  }

  // Lazy-load ioredis only when REDIS_URL is set so the bundle is not affected today.
  // To use: add ioredis — `npm i ioredis`
  // Then uncomment the block below and remove the stub.

  /*
  const Redis = require("ioredis");
  const redis = new Redis(url);
  _client = {
    get: (key) => redis.get(key),
    set: (key, value, opts) =>
      opts?.ex ? redis.set(key, value, "EX", opts.ex) : redis.set(key, value),
    del: (key) => redis.del(key),
  };
  return _client;
  */

  // Stub until ioredis is installed
  _client = null;
  return null;
}
