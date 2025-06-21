import getRedisClient from '../config/redisConfig.js';
import getHash from '../utils/hasher.js';

const cacheMiddleware =
  (ttl = 60) =>
  async (req, res, next) => {
    const requestString = `${req.method}::${req.originalUrl}:${JSON.stringify(req.body)}`;
    const hash = getHash(requestString);
    const redisClient = getRedisClient();
    const cachedResponse = await redisClient.get(hash);
    if (cachedResponse) {
      await redisClient.expire(hash, ttl / 2); // Refresh TTL
      return res.status(200).send(JSON.parse(cachedResponse));
    }
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      await redisClient.setEx(hash, ttl, JSON.stringify(data));
      return originalJson(data);
    };
    next();
  };

export default cacheMiddleware;
