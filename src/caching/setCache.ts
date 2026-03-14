import redis from "../lib/redis";

export async function setCache(key: string, data: any, ttlSeconds = 60) {
  const serialized =
    typeof data === "string" ? data : JSON.stringify(data);
  await redis.set(key, serialized, {
    ex: ttlSeconds,
  });
}

export async function invalidateCache(pattern: string) {
  let cursor = "0";

  do {
    const [nextCursor, keys] = await redis.scan(cursor, {
      match: pattern,
      count: 100,
    });

    cursor = nextCursor;

    if (keys?.length) {
      await redis.del(...keys);
    }

  } while (cursor !== "0");
}