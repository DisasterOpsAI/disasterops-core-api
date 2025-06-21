const serverless = require('serverless-http');

exports.handler = async (event, context) => {
  const { default: app } = await import('../src/app.js');
  return serverless(app)(event, context);
};
