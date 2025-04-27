import express from 'express';

const app = express();

app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Avicultura Dia a Dia!' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});