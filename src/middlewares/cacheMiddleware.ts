import { Request, Response, NextFunction } from "express";
import redis from "../lib/redis";

export function cacheMiddleware(
  keyBuilder: (req: Request) => string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = keyBuilder(req);

    try {
      const cachedData = await redis.get(cacheKey);
      if (!cachedData) {
        return next();
      }
      console.log(`[CACHE HIT] ${cacheKey}`);
      return res.status(200).json(cachedData);
    } catch (err) {
      await redis.del(cacheKey);
      return next();
    }
  };
}
