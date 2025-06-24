import { getAuth } from 'firebase-admin/auth';
import getLogger from '../config/loggerConfig.js';

const logger = getLogger();

export default async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'Unauthorized', message: 'No token provided' });
  }

  const idToken = header.slice(7).trim();

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    req.user = { uid: decoded.uid, ...decoded };
    res.locals.uid = decoded.uid;
    return next();
  } catch (err) {
    logger.error('Unauthorized access attempt', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'An error occurred during authentication.',
    });
  }
}
