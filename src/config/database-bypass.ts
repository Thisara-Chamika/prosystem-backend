import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';
import dotenv from 'dotenv';

dotenv.config();

const bypassPool = new Pool({
  connectionString: process.env.BYPASS_DATABASE_URL,
});

// ONLY for pre-login lookups (login/register/forgot-password) 
export const dbBypass = drizzle(bypassPool, { schema });