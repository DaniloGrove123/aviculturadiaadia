import { Pool } from 'pg';
import { promisify } from 'util';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';

// --- CONFIGURE SUA CONEXÃO ABAIXO ---
// Use variáveis de ambiente reais na Vercel!
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Adicione outras opções se necessário
});

const scryptAsync = promisify(scrypt);

export async function getUserByUsername(username) {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
}

export async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.')
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}
