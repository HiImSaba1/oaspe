import "server-only";
import mysql, { type Pool } from "mysql2/promise";

let pool: Pool | undefined;

export function isDatabaseConfigured() {
  return Boolean(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER);
}

export function getDatabase() {
  if (!isDatabaseConfigured()) throw new Error("Database is not configured.");
  if (process.env.DB_NAME !== "next_oaspe") throw new Error("Refusing to use a database other than next_oaspe.");
  pool ??= mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? "",
    charset: "utf8mb4",
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 4),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
  });
  return pool;
}
