export default function handler(req, res) {
  console.log('Handler /api/hello executado');
  try {
    res.status(200).json({ message: 'Hello from Avicultura Dia a Dia!' });
  } catch (err) {
    console.error('Erro na função /api/hello:', err);
    res.status(500).json({ error: 'Erro interno na função serverless.' });
  }
}

/ /   t r i g g e r   r e d e p l o y  
 / /   r e d e p l o y   t r i g g e r      
 / /  
 r e d e p l o y  
 t r i g g e r  
 