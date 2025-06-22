import getLogger from '../config/loggerConfig.js';
import redisClient from '../config/redisConfig.js';
import getHash from '../utils/hasher.js';
const logger = getLogger();
const cacheMiddleware =
  (ttl = 60) =>
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
      const cachedResponse = await redisClient.get(hash);
      if (cachedResponse) {
        await redisClient.expire(hash, ttl); // Refresh TTL
        return res.status(200).send(JSON.parse(cachedResponse));
      }
      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        await redisClient.setEx(hash, ttl, JSON.stringify(data));
        return originalJson(data);
      };
      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(error);
    }
  };

export default cacheMiddleware;
