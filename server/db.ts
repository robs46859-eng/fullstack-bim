import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

let pool: Pool | null = null;

if (DATABASE_URL) {
  pool = new Pool({ connectionString: DATABASE_URL });
  console.log('[db] Connected to Postgres');
} else {
  console.warn('[db] DATABASE_URL not set — DB routes will return 503');
}

export async function query(text: string, params?: any[]) {
  if (!pool) {
    throw new Error('Database not configured');
  }
  return pool.query(text, params);
}

export { pool };
