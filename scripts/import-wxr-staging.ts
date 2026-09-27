import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { parseWxrItem, type WxrRecord } from "../src/lib/migration/wxr";
import { assertDatabaseIdentity, createDatabasePool } from "./database-common";

const xmlPath = process.argv[2];
if (!xmlPath) throw new Error("Usage: import-wxr-staging.ts <path-to-wxr.xml>");

async function parseItems(filePath: string) {
  const records: WxrRecord[] = [];
  const lines = readline.createInterface({ input: createReadStream(filePath, { encoding: "utf8" }), crlfDelay: Infinity });
  let item = ""; let collecting = false;
  for await (const line of lines) {
    if (line.includes("<item>")) { collecting = true; item = ""; }
    if (collecting) item += `${line}\n`;
    if (collecting && line.includes("</item>")) { records.push(parseWxrItem(item)); collecting = false; item = ""; }
  }
  return records;
}

async function main() {
  const source = await readFile(xmlPath);
  const sourceHash = createHash("sha256").update(source).digest("hex");
  const records = await parseItems(xmlPath);
  if (records.length !== 1466) throw new Error(`Expected 1466 WXR records, parsed ${records.length}.`);
  const runId = randomUUID();
  const pool = createDatabasePool();
  try {
    await assertDatabaseIdentity(pool);
    await pool.execute("INSERT INTO oaspe_import_runs (id, source_filename, source_sha256, expected_records) VALUES (?, ?, ?, ?)", [runId, path.basename(xmlPath), sourceHash, records.length]);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const record of records) {
        const migrationState = record.quarantineReasons.length ? "quarantined" : "staged";
        await connection.execute(
        `INSERT INTO oaspe_wxr_records (wordpress_id, post_type, legacy_status, migration_state, title, slug, published_at, creator, parent_wordpress_id, attachment_url, sanitized_html, content_sha256, media_urls_json, taxonomy_json, quarantine_reasons_json, first_import_run_id, last_import_run_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE post_type=VALUES(post_type), legacy_status=VALUES(legacy_status), migration_state=VALUES(migration_state), title=VALUES(title), slug=VALUES(slug), published_at=VALUES(published_at), creator=VALUES(creator), parent_wordpress_id=VALUES(parent_wordpress_id), attachment_url=VALUES(attachment_url), sanitized_html=VALUES(sanitized_html), content_sha256=VALUES(content_sha256), media_urls_json=VALUES(media_urls_json), taxonomy_json=VALUES(taxonomy_json), quarantine_reasons_json=VALUES(quarantine_reasons_json), last_import_run_id=VALUES(last_import_run_id)`,
        [record.wordpressId, record.postType, record.status, migrationState, record.title, record.slug, record.publishedAt, record.creator, record.parentWordpressId, record.attachmentUrl, record.sanitizedHtml, record.contentHash, JSON.stringify(record.mediaUrls), JSON.stringify(record.taxonomy), JSON.stringify(record.quarantineReasons), runId, runId],
        );
      }
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
    const quarantined = records.filter((record) => record.quarantineReasons.length > 0).length;
    await pool.execute("UPDATE oaspe_import_runs SET status='completed', staged_records=?, quarantined_records=?, completed_at=CURRENT_TIMESTAMP(3) WHERE id=?", [records.length - quarantined, quarantined, runId]);
    console.log(JSON.stringify({ runId, sourceSha256: sourceHash, total: records.length, staged: records.length - quarantined, quarantined, published: 0 }, null, 2));
  } catch (error) {
    await pool.execute("UPDATE oaspe_import_runs SET status='failed', error_message=?, completed_at=CURRENT_TIMESTAMP(3) WHERE id=?", [error instanceof Error ? error.message.slice(0, 500) : "Import failed", runId]).catch(() => undefined);
    throw error;
  } finally { await pool.end(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
