// server/src/db.js
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const { DATABASE_URL, FORCE_DB_SSL } = process.env;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  process.exit(1);
}

function resolveSslOption(dbUrl) {
  try {
    const u = new URL(dbUrl);
    const host = (u.hostname || '').toLowerCase();
    const sslmode = (u.searchParams.get('sslmode') || '').toLowerCase();
    const force = (FORCE_DB_SSL || '').toLowerCase();

    if (force === 'true' || force === '1') return { rejectUnauthorized: false };
    if (force === 'false' || force === '0') return false;

    if (sslmode === 'require') return { rejectUnauthorized: false };

    const isLocal =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.endsWith('.local');

    const isCloudThatNeedsSSL =
      host.includes('render') ||
      host.includes('neon.tech') ||
      host.includes('supabase') ||
      host.includes('heroku') ||
      host.includes('aws') ||
      host.includes('azure') ||
      host.includes('googleapis');

    if (isLocal) return false;
    if (isCloudThatNeedsSSL) return { rejectUnauthorized: false };

    return false;
  } catch {
    return false;
  }
}

const sslOption = resolveSslOption(DATABASE_URL);

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: sslOption, 
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', async (client) => {
  try {
    await client.query(`SET search_path TO public`);
  } catch (e) {
    console.error('Error setting search_path:', e);
  }
});

export function query(text, params) {
  return pool.query(text, params);
}

export default pool;


