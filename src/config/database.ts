import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool using DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully!');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Export pool for RLS usage later
export { pool };