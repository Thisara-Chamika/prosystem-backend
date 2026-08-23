import { Request, Response, NextFunction } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { pool, requestContext } from "../config/database";
import * as schema from "../db/schema";

export const setRlsContext = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const client = await pool.connect();
  let released = false;

  const closeConnection = async (commit: boolean) => {
    if (released) return;
    released = true;
    try {
      await client.query(commit ? "COMMIT" : "ROLLBACK");
    } catch (err) {
      console.error("Failed to close request transaction:", err);
    } finally {
      client.release();
    }
  };

  try {
    await client.query("BEGIN");

    const shopId = req.user?.shopId ?? "";
    const role = req.user?.role ?? "";

    await client.query(`SELECT set_config('app.current_shop_id', $1, true)`, [
      shopId,
    ]);
    await client.query(`SELECT set_config('app.current_role', $1, true)`, [
      role,
    ]);

    // A Drizzle instance bound to THIS one specific connection, not the pool
    const requestDb = drizzle(client, { schema });

    // Close and release cleanly no matter how the request ends
    res.on("finish", () => closeConnection(true));
    res.on("close", () => closeConnection(false));

    requestContext.run({ db: requestDb }, () => next());
  } catch (error) {
    console.error("RLS context setup failed:", error);
    await closeConnection(false);
    res
      .status(500)
      .json({ success: false, message: "RLS context setup failed!" });
  }
};
