import express from 'express';
import expressWinston from 'express-winston';
import getLogger from './config/loggerConfig.js';
import userRoutes from './routes/userRoutes.js';

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

app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.stack });
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
