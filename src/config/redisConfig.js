import { createClient } from 'redis';
import getLogger from './loggerConfig.js';

const logger = getLogger();

const redisClient = createClient({
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_SOCKET_HOST,
    port: parseInt(process.env.REDIS_SOCKET_PORT, 10),
  },
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

redisClient.connect()
  .then(() => logger.info('Redis client connected successfully!'))
  .catch((err) => logger.error('Redis client failed to connect', err));

export default redisClient;
