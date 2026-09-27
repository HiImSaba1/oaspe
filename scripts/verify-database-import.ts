import type { RowDataPacket } from "mysql2/promise";
import { assertDatabaseIdentity, createDatabasePool } from "./database-common";

async function main() {
  const pool = createDatabasePool();
  try {
    await assertDatabaseIdentity(pool);
    const [rows] = await pool.query<(RowDataPacket & { total: number; staged: number; quarantined: number; approved: number })[]>("SELECT COUNT(*) total, SUM(migration_state='staged') staged, SUM(migration_state='quarantined') quarantined, SUM(migration_state='approved') approved FROM oaspe_wxr_records");
    const counts = rows[0];
    if (Number(counts.total) !== 1466) throw new Error(`Expected 1466 staged records, found ${counts.total}.`);
    if (Number(counts.approved) !== 0) throw new Error("No records may be approved during the staging sprint.");
    if (Number(counts.quarantined) < 1000) throw new Error("Expected the known quarantine population, but the count is unexpectedly low.");
    console.log(JSON.stringify({ database: "next_oaspe", total: Number(counts.total), staged: Number(counts.staged), quarantined: Number(counts.quarantined), approved: Number(counts.approved), publicReadsEnabled: false }, null, 2));
  } finally { await pool.end(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
