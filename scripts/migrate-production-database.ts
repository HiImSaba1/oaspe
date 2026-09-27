import { readFile } from "node:fs/promises";
import path from "node:path";
import { assertDatabaseIdentity, createDatabasePool } from "./database-common";

const migrations = ["002_simple_admin.sql", "003_sxetika_hero.sql"] as const;

async function main() {
  if (process.env.NODE_ENV !== "production") throw new Error("Production migrations require NODE_ENV=production.");
  const pool = createDatabasePool();
  try {
    await assertDatabaseIdentity(pool);
    await pool.execute("CREATE TABLE IF NOT EXISTS oaspe_schema_migrations (migration_id VARCHAR(100) PRIMARY KEY, applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    for (const migration of migrations) {
      const [existing] = await pool.execute("SELECT migration_id FROM oaspe_schema_migrations WHERE migration_id = ?", [migration]);
      if (Array.isArray(existing) && existing.length > 0) { console.log(`SKIP ${migration}`); continue; }
      const sql = await readFile(path.join(process.cwd(), "database", "migrations", migration), "utf8");
      const statements = sql.split(/\r?\n-- statement-breakpoint\r?\n/).map((value) => value.trim()).filter(Boolean);
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        for (const statement of statements) await connection.query(statement);
        await connection.execute("INSERT INTO oaspe_schema_migrations (migration_id) VALUES (?)", [migration]);
        await connection.commit();
        console.log(`APPLIED ${migration}`);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally { connection.release(); }
    }
  } finally { await pool.end(); }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
