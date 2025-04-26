console.log('Iniciando api/index.cjs');

const express = require('express');
const serverless = require('serverless-http');

console.log('serverless:', serverless); // Adiciona log para verificar o módulo

const app = express();

app.use(express.json());

app.get('/api/hello', (req, res) => {
  console.log('Requisição recebida em /api/hello');
  res.json({ message: 'Hello from Avicultura Dia a Dia!' });
});

console.log('Exportando função serverless');
module.exports = serverless(app);