import { createClient } from 'redis';
import getLogger from './loggerConfig.js';
const logger = getLogger();
var _redis_client = null;

const getRedisClient = () => {
  if (!_redis_client) {
    _redis_client = createClient({
      username: process.env.REDIS_USERNAME || 'default',
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_SOCKET_HOST,
        port: process.env.REDIS_SOCKET_PORT,
      },
    });

    _redis_client.on('error', (err) => logger.info('Redis Client Error', err));

    _redis_client.connect().then(() => {
      logger.info('Redis client connected successfully!');
    });
  }
  return _redis_client;
};
getRedisClient();
export default getRedisClient;
