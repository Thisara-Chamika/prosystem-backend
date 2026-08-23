import { AsyncLocalStorage } from "async_hooks";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../db/schema";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("✅ Database connected successfully!");
});

pool.on("error", (err) => {
  console.error("❌ Database connection error:", err);
  process.exit(-1);
});

type DrizzleDB = NodePgDatabase<typeof schema>;

// Holds ONE connection per request, for that request's entire lifetime
export const requestContext = new AsyncLocalStorage<{ db: DrizzleDB }>();

// Fallback database connection for non-request contexts
const fallbackDb = drizzle(pool, { schema });

// This is the main database object that should be used throughout the application.
export const db: DrizzleDB = new Proxy({} as DrizzleDB, {
  get(_target, prop) {
    const store = requestContext.getStore();
    const activeDb = store?.db ?? fallbackDb;
    const value = (activeDb as any)[prop];
    return typeof value === "function" ? value.bind(activeDb) : value;
  },
});

export { pool };