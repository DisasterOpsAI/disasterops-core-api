import express from 'express';
import expressWinston from 'express-winston';
import getLogger from './config/loggerConfig.js';
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
app.get('/', (_, res) => res.send('API Running'));

export default app;
