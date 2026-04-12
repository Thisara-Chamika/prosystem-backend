import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';

export const setRlsContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const client = await pool.connect();

  try {
    if (req.user) {
      const shopId = req.user.shopId ?? '';
      const role = req.user.role ?? '';

      // Set session variables for RLS
      await client.query(
        `SELECT set_config('app.current_shop_id', $1, true)`,
        [shopId]
      );

      await client.query(
        `SELECT set_config('app.current_role', $1, true)`,
        [role]
      );
    }

    next();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'RLS context setup failed!',
    });
  } finally {
    client.release();
  }
};