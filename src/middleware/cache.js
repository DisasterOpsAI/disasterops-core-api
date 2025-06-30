import getLogger from '../config/loggerConfig.js';
import redisClient from '../config/redisConfig.js';
import getHash from '../utils/hasher.js';
import responseBinder from '../utils/responseBinder.js';
const logger = getLogger();
const cacheMiddleware =
  (ttl = 60, noRetries = 10, retryDelay = 100) =>
  async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const hasValidToken =
        authHeader &&
        authHeader.startsWith('Bearer ') &&
        authHeader.split(' ')[1]; // TODO: #25

      if (req.method !== 'GET' || hasValidToken) {
        return next();
      }
      const requestString = `${req.method}::${req.originalUrl}`;
      const hash = getHash(requestString);
      const cacheKey = `cache:${hash}`;
      const lockKey = `lock:${hash}`;
      const cachedResponse = await redisClient.get(cacheKey);
      if (cachedResponse) {
        await redisClient.expire(cacheKey, ttl); // Refresh TTL
        return res.status(200).send(JSON.parse(cachedResponse));
      }
      const gotLock = await redisClient.set(lockKey, cacheKey, {
        NX: true,
        EX: ttl,
      });
      if (gotLock) {
        res = responseBinder(res, async (response) => {
          redisClient
            .multi()
            .setEx(cacheKey, ttl, JSON.stringify(response))
            .del(lockKey)
            .exec()
            .catch((err) => {
              logger.error('Failed to set cache or delete lock key', err);
            });
        });
      }
      for (let i = 0; i < noRetries; i++) {
        await new Promise((r) => setTimeout(r, retryDelay));
        const cachedNow = await redisClient.get(cacheKey);
        if (cachedNow) {
          return res.json(JSON.parse(cachedNow));
        }
      }
      res = responseBinder(res, async (response) => {
        await redisClient.setEx(cacheKey, ttl, JSON.stringify(response));
        return response;
      }); // Fallback incase the lock was not acquired
      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(error);
    }
  };

export default cacheMiddleware;
