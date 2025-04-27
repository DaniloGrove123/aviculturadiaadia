console.log('Iniciando api/index.cjs');

const serverless = require('serverless-http');
const app = require('../server/index'); // Importa o app Express já configurado

console.log('Exportando função serverless com app real');
module.exports = serverless(app);