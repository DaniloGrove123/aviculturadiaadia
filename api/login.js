import { storage } from '../dist/server/storage.js';
import { promisify } from 'util';
import { scrypt, timingSafeEqual } from 'crypto';

console.log('Iniciando handler /api/login');

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied, stored) {
  console.log('Comparando senha...');
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export default async function handler(req, res) {
  console.log('Método:', req.method);
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { username, password } = req.body || {};
  console.log('Body recebido:', req.body);
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  try {
    console.log('Buscando usuário:', username);
    const user = await storage.getUserByUsername(username);
    console.log('Usuário encontrado:', !!user);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const senhaOk = await comparePasswords(password, user.password);
    console.log('Senha correta:', senhaOk);
    if (!senhaOk) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    // Nunca envie a senha de volta!
    const { password: _, ...safeUser } = user;
    console.log('Login bem-sucedido:', safeUser);
    res.status(200).json(safeUser);
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno no login', details: err?.message });
  }
}
