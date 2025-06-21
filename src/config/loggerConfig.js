import { createLogger, transports, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

var _logger = null;
const getLogger = () => {
  if (!_logger) {
    _logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.colorize(),
        format.printf(({ timestamp, level, message }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      ),
      transports: [
        new transports.Console(),
        new DailyRotateFile({
          filename: 'logs/%DATE%-results.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '14d',
        }),
      ],
    });
    _logger.info(
      'Logger initialized successfully! Ready to track your application logs'
    );
  }
  return _logger;
};
export default getLogger;
