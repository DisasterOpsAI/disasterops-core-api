import { getAuth } from 'firebase-admin/auth';
import getLogger from '../config/loggerConfig.js';
import { ROLES } from '../config/rolesConfig.js';

const logger = getLogger();

export default function authMiddleware(
  allowedRoles = [ROLES.VOLUNTEER, ROLES.FIRST_RESPONDER]
) {
  return async function (req, res, next) {
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ error: 'Unauthorized', message: 'No token provided' });
    }

    const idToken = header.slice(7).trim();

    // For testing with test-token
    if (idToken === 'test-token') {
      req.user = { uid: 'test-uid', customClaims: { role: ROLES.VOLUNTEER } };
      res.locals.uid = 'test-uid';
      return next();
    }

    try {
      const decoded = await getAuth().verifyIdToken(idToken); 
      const uid = decoded.uid;
      const userRecord = await getAuth().getUser(uid);
      req.user = userRecord;
      res.locals.uid = uid;

      if (!userRecord.customClaims || !userRecord.customClaims.role) {
        logger.error('Forbidden access attempt', {
          uid,
          role: 'no role assigned',
        });
        return res
          .status(403)
          .json({ error: 'Forbidden', message: 'No role assigned' });
      }

      const role = userRecord.customClaims.role;
      if (!allowedRoles.includes(role)) {
        logger.error('Forbidden access attempt', { uid, role });
        return res
          .status(403)
          .json({ error: 'Forbidden', message: 'Insufficient role' });
      }

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
        message: err.message,
      });
    }
  };
}
