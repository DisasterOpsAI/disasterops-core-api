import express from 'express';
import expressWinston from 'express-winston';
import getLogger from './config/loggerConfig.js';
import cacheMiddleware from './middleware/cache.js';
const logger = getLogger();
const app = express();
app.use(express.json());
app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}}',
    expressFormat: true,
    colorize: true,
    ignoreRoute: () => false,
  })
);
app.use(cacheMiddleware(60)); // Cache responses for 60 seconds
app.get('/', (_, res) => res.send('API Running'));
export default app;
