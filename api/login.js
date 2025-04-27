import { getUserByUsername, comparePasswords } from './_utils/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  try {
    const user = await getUserByUsername(username);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const senhaOk = await comparePasswords(password, user.password);
    if (!senhaOk) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    // Nunca envie a senha de volta!
    const { password: _, ...safeUser } = user;
    res.status(200).json(safeUser);
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno no login', details: err?.message });
  }
}
