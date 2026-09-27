import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { createInterface } from "node:readline";
import { parseWxrItem, type WxrRecord } from "../src/lib/migration/wxr";

type CountMap = Record<string, number>;
const increment = (map: CountMap, key: string) => { map[key || "(empty)"] = (map[key || "(empty)"] ?? 0) + 1; };

async function main() {
  const xmlPath = resolve(process.argv[2] ?? "../OASPE_FULL_WordPress.2026-09-23.xml");
  const outputDir = resolve(process.argv[3] ?? ".artifacts/sprint02");
  const counts: CountMap = {}; const statuses: CountMap = {}; const mappings: Array<Pick<WxrRecord, "wordpressId" | "postType" | "status" | "title" | "slug" | "parentWordpressId" | "contentHash">> = [];
  const quarantine: Array<{ wordpressId: number; postType: string; slug: string; reasons: string[] }> = [];
  let inItem = false; let item = ""; let total = 0; let sanitizedChanged = 0; let mediaReferences = 0;
  const reader = createInterface({ input: createReadStream(xmlPath, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of reader) {
    if (!inItem && line.includes("<item>")) { inItem = true; item = `${line}\n`; continue; }
    if (!inItem) continue; item += `${line}\n`; if (!line.includes("</item>")) continue;
    const record = parseWxrItem(item); total += 1; increment(counts, record.postType); increment(statuses, record.status); mediaReferences += record.mediaUrls.length;
    if (record.quarantineReasons.length) quarantine.push({ wordpressId: record.wordpressId, postType: record.postType, slug: record.slug, reasons: record.quarantineReasons });
    if (record.quarantineReasons.length || /<(?:script|iframe|form|object|embed)\b/i.test(item)) sanitizedChanged += 1;
    mappings.push({ wordpressId: record.wordpressId, postType: record.postType, status: record.status, title: record.title, slug: record.slug, parentWordpressId: record.parentWordpressId, contentHash: record.contentHash });
    inItem = false; item = "";
  }
  const expectedTotal = 1466;
  const reconciliation = { expectedTotal, parsedTotal: total, difference: total - expectedTotal, exact: total === expectedTotal };
  const manifest = { generatedAt: new Date().toISOString(), source: basename(xmlPath), mode: "dry-run", counts, statuses, totals: { records: total, mappings: mappings.length, quarantined: quarantine.length, sanitizedChanged, mediaReferences }, reconciliation, safety: { databaseWrites: false, mediaDownloads: false, publishedAnything: false, rawQuarantinedHtmlPersisted: false } };
  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outputDir, "import-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
    writeFile(resolve(outputDir, "record-map.json"), `${JSON.stringify(mappings, null, 2)}\n`, "utf8"),
    writeFile(resolve(outputDir, "quarantine.json"), `${JSON.stringify(quarantine, null, 2)}\n`, "utf8"),
    writeFile(resolve(outputDir, "reconciliation.json"), `${JSON.stringify(reconciliation, null, 2)}\n`, "utf8"),
  ]);
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
  if (!reconciliation.exact) process.exitCode = 1;
}

main().catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`); process.exitCode = 1; });
