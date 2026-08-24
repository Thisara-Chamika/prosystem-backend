import { Request, Response, NextFunction } from 'express';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pool, requestContext } from '../config/database';
import * as schema from '../db/schema';

export const setRlsContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const client = await pool.connect();
  let released = false;

  const releaseConnection = async () => {
    if (released) return;
    released = true;
    try {
      // Reset the RLS context before releasing the connection
      await client.query(`SELECT set_config('app.current_shop_id', '', false)`);
      await client.query(`SELECT set_config('app.current_role', '', false)`);
    } catch (err) {
      console.error('Failed to reset RLS context before releasing connection:', err);
    } finally {
      client.release();
    }
  };

  try {
    const shopId = req.user?.shopId ?? '';
    const role = req.user?.role ?? '';

    // Set the RLS context for the current request
    await client.query(`SELECT set_config('app.current_shop_id', $1, false)`, [shopId]);
    await client.query(`SELECT set_config('app.current_role', $1, false)`, [role]);

    const requestDb = drizzle(client, { schema });

    res.on('finish', () => { releaseConnection(); });
    res.on('close', () => { releaseConnection(); });

    requestContext.run({ db: requestDb }, () => next());
  } catch (error) {
    console.error('RLS context setup failed:', error);
    await releaseConnection();
    res.status(500).json({ success: false, message: 'RLS context setup failed!' });
  }
};