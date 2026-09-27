import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

function required(name: string, allowEmpty = false) {
  const value = process.env[name];
  if (value === undefined || (!allowEmpty && value.length === 0)) throw new Error(`${name} is not configured.`);
  return value;
}

export function createDatabasePool(): Pool {
  if (required("DB_NAME") !== "next_oaspe") throw new Error("Refusing to operate on a database other than next_oaspe.");
  return mysql.createPool({
    host: required("DB_HOST"), port: Number(required("DB_PORT")), database: required("DB_NAME"), user: required("DB_USER"), password: required("DB_PASSWORD", true),
    charset: "utf8mb4", connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 4), multipleStatements: false,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
  });
}

export async function assertDatabaseIdentity(pool: Pool) {
  const [rows] = await pool.query<(RowDataPacket & { database_name: string })[]>("SELECT DATABASE() AS database_name");
  if (rows[0]?.database_name !== "next_oaspe") throw new Error("Connected database identity does not match next_oaspe.");
}
