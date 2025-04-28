console.log('Iniciando API handler (serverless)');

const serverless = require('serverless-http');
const { createApp } = require('../server/app');

let handler;

module.exports = async (req, res) => {
  if (!handler) {
    const app = await createApp();
    handler = serverless(app);
  }
  console.log(`Chamando rota ${req.method} ${req.url}`);
  return handler(req, res);
};