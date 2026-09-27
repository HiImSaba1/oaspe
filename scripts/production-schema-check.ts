import type { RowDataPacket } from "mysql2/promise";
import { assertDatabaseIdentity, createDatabasePool } from "./database-common";

const requiredTables = ["oaspe_schema_migrations", "oaspe_page_sections", "oaspe_portfolio_projects", "oaspe_portfolio_deletions", "oaspe_contact_messages"];

async function main() {
  const pool = createDatabasePool();
  try {
    await assertDatabaseIdentity(pool);
    const [rows] = await pool.query<(RowDataPacket & { table_name: string })[]>("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN (?)", [requiredTables]);
    const present = new Set(rows.map((row) => row.table_name));
    const missing = requiredTables.filter((table) => !present.has(table));
    if (missing.length) throw new Error(`Production schema is missing: ${missing.join(", ")}`);
    console.log(`Production schema contract: PASS (${requiredTables.length} required tables).`);
  } finally { await pool.end(); }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
