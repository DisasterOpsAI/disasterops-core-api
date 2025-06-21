import { createLogger, transports, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

var _logger = null;
const getLogger = () => {
  if (!_logger) {
    // Check if running in AWS Lambda environment
    const isLambda = process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    const loggerTransports = [new transports.Console()];
    
    // Only add file transport if not in Lambda environment
    if (!isLambda) {
      loggerTransports.push(
        new DailyRotateFile({
          filename: 'logs/%DATE%-results.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '14d',
        })
      );
    }
    
    _logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.colorize(),
        format.printf(({ timestamp, level, message }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      ),
      transports: loggerTransports,
    });
    _logger.info(
      'Logger initialized successfully! Ready to track your application logs'
    );
  }
  return _logger;
};
export default getLogger;
