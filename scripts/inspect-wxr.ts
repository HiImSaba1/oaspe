import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { createInterface } from "node:readline";

type CountMap = Record<string, number>;
type PageRecord = { title: string; slug: string; status: string; wordpressId: number | null };

function increment(target: CountMap, key: string) {
  const normalized = key || "(empty)";
  target[normalized] = (target[normalized] ?? 0) + 1;
}

function cdata(source: string, tag: string) {
  return source.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))?.[1]?.trim() ?? "";
}

function text(source: string, tag: string) {
  return source.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.trim() ?? "";
}

async function sha256(file: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk as Buffer);
  return hash.digest("hex");
}

async function main() {
  const xmlPath = resolve(process.argv[2] ?? "../OASPE_FULL_WordPress.2026-09-23.xml");
  const outputDir = resolve(process.argv[3] ?? ".artifacts/sprint00");
  const file = await stat(xmlPath);
  const postTypes: CountMap = {};
  const statuses: CountMap = {};
  const pages: PageRecord[] = [];
  let itemCount = 0;
  let attachmentUrls = 0;
  let itemsWithActiveContent = 0;
  let inItem = false;
  let item = "";

  const reader = createInterface({ input: createReadStream(xmlPath, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of reader) {
    if (!inItem && line.includes("<item>")) { inItem = true; item = `${line}\n`; continue; }
    if (!inItem) continue;
    item += `${line}\n`;
    if (!line.includes("</item>")) continue;

    itemCount += 1;
    const postType = cdata(item, "wp:post_type");
    const status = cdata(item, "wp:status");
    increment(postTypes, postType);
    increment(statuses, status);
    if (item.includes("<wp:attachment_url>")) attachmentUrls += 1;
    if (/<script\b|<iframe\b|javascript:/i.test(cdata(item, "content:encoded"))) itemsWithActiveContent += 1;
    if (postType === "page") {
      const idValue = Number(text(item, "wp:post_id"));
      pages.push({ title: cdata(item, "title"), slug: cdata(item, "wp:post_name"), status, wordpressId: Number.isFinite(idValue) ? idValue : null });
    }
    inItem = false; item = "";
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: { filename: basename(xmlPath), absolutePath: xmlPath, bytes: file.size, sha256: await sha256(xmlPath), format: "WordPress WXR 1.2" },
    totals: { items: itemCount, attachmentUrls, itemsWithPotentialActiveContent: itemsWithActiveContent },
    postTypes: Object.fromEntries(Object.entries(postTypes).sort((a, b) => b[1] - a[1])),
    statuses: Object.fromEntries(Object.entries(statuses).sort((a, b) => b[1] - a[1])),
    pages: pages.sort((a, b) => a.wordpressId! - b.wordpressId!),
    safety: { mode: "read-only", databaseWrites: false, mediaDownloads: false, publishedAnything: false },
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(resolve(outputDir, "wxr-inventory.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
