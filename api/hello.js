module.exports = (req, res) => {
  console.log('Handler /api/hello executado');
  try {
    res.status(200).json({ message: 'Hello from Avicultura Dia a Dia!' });
  } catch (err) {
    console.error('Erro na função /api/hello:', err);
    res.status(500).json({ error: 'Erro interno na função serverless.' });
  }
};
