import express from 'express';
import serverless from 'serverless-http';

const app = express();

app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Avicultura Dia a Dia! (Updated at 10:34 AM)' });
});

export default serverless(app);