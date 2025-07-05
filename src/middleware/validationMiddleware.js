import getLogger from '../config/loggerConfig.js';
const logger = getLogger();

export default function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const messages = error.details.map((d) => d.message);
      logger.error('Request validation failed', { errors: messages });
      return res.status(400).json({
        error: 'Bad Request',
        message: messages.join('; '),
      });
    }
    req.body = value;
    next();
  };
}
