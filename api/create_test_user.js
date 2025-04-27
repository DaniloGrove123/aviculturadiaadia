import { hashPassword } from './_utils/auth.js';
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  try {
    const username = 'admin3';
    const password = await hashPassword('senha123');
    await pool.query(
      'INSERT INTO users (username, password, email, created_at) VALUES ($1, $2, $3, NOW())',
      [username, password, 'admin3@exemplo.com']
    );
    res.status(200).json({ success: true, password });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
