import { createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import { articles } from "../src/data/articles";

const outputRoot = path.join(process.cwd(), "public", "wp-images", "articles");
const prefix = "https://oaspe.org/wp-content/uploads/";

function safeSegment(value: string) { return decodeURIComponent(value).replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/[. ]+$/g, "") || "asset"; }
async function exists(filePath: string) { try { return (await stat(filePath)).size > 0; } catch { return false; } }

async function download(source: string) {
  if (!source.startsWith(prefix)) throw new Error(`Unapproved media host: ${source}`);
  const relative = source.slice(prefix.length).split("/").map(safeSegment);
  const target = path.join(outputRoot, ...relative);
  await mkdir(path.dirname(target), { recursive: true });
  if (await exists(target)) return { source, localUrl: `/wp-images/articles/${relative.map(encodeURIComponent).join("/")}`, status: "skipped" as const };
  const temporary = `${target}.part`; let lastError = "Unknown download failure";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(source, { signal: AbortSignal.timeout(30_000), headers: { "user-agent": "OASPE-Reviewed-Media-Migration/1.0" } });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      await pipeline(Readable.fromWeb(response.body as unknown as NodeWebReadableStream), createWriteStream(temporary));
      await rename(temporary, target);
      return { source, localUrl: `/wp-images/articles/${relative.map(encodeURIComponent).join("/")}`, status: "downloaded" as const };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      await rm(temporary, { force: true });
    }
  }
  return { source, localUrl: `/wp-images/articles/${relative.map(encodeURIComponent).join("/")}`, status: "failed" as const, error: lastError };
}

async function main() {
  const sources = [...new Set(articles.map((article) => article.image))];
  const results = [];
  for (const [index, source] of sources.entries()) {
    const result = await download(source); results.push(result);
    console.log(`[${index + 1}/${sources.length}] ${result.status.toUpperCase()} ${result.localUrl}`);
  }
  const manifest = { generatedAt: new Date().toISOString(), policy: "reviewed-article-media-only", total: sources.length, downloaded: results.filter((item) => item.status === "downloaded").length, skipped: results.filter((item) => item.status === "skipped").length, failed: results.filter((item) => item.status === "failed").length, items: results };
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  if (manifest.failed > 0) throw new Error(`${manifest.failed} reviewed media downloads failed.`);
  console.log(`Reviewed article media ready: ${manifest.total} files, 0 failures.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
