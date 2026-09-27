import { createWriteStream } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";

const projectRoot = path.join(import.meta.dirname, "..");
const sourceRoot = path.join(projectRoot, "src");
const outputRoot = path.join(projectRoot, "public", "images", "wp-content", "uploads");
const remotePrefix = "https://oaspe.org/wp-content/uploads/";
const localPrefix = "/images/wp-content/uploads/";
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(target) : sourceExtensions.has(path.extname(entry.name)) ? [target] : [];
  }));
  return files.flat();
}

async function collectUrls() {
  const urls = new Set<string>();
  for (const file of await sourceFiles(sourceRoot)) {
    if (file.endsWith(`${path.sep}lib${path.sep}migration${path.sep}wxr.test.ts`)) continue;
    const content = await readFile(file, "utf8");
    for (const match of content.matchAll(/https:\/\/oaspe\.org\/wp-content\/uploads\/[^\s"'`)]+/g)) urls.add(match[0]);
    for (const match of content.matchAll(/\/images\/wp-content\/uploads\/[^\s"'`)]+/g)) {
      urls.add(`${remotePrefix}${match[0].slice(localPrefix.length)}`);
    }
  }
  return [...urls].sort();
}

function safeSegments(source: string) {
  return new URL(source).pathname.split("/wp-content/uploads/")[1].split("/").map((segment) => decodeURIComponent(segment).replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/[. ]+$/g, ""));
}

async function exists(file: string) { try { return (await stat(file)).size > 0; } catch { return false; } }

function candidates(source: string) {
  const original = source.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, "");
  return original === source ? [source] : [source, original];
}

async function download(source: string) {
  const relative = safeSegments(source);
  const target = path.join(outputRoot, ...relative);
  const publicUrl = `${localPrefix}${relative.map(encodeURIComponent).join("/")}`;
  await mkdir(path.dirname(target), { recursive: true });
  if (await exists(target)) return { source, resolvedSource: source, publicUrl, status: "skipped" as const };
  const temporary = `${target}.part`;
  let lastError = "Unknown download failure";
  for (const candidate of candidates(source)) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(candidate, { signal: AbortSignal.timeout(30_000), headers: { "user-agent": "OASPE-Site-Media/1.0" } });
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
        await pipeline(Readable.fromWeb(response.body as unknown as NodeWebReadableStream), createWriteStream(temporary));
        await rename(temporary, target);
        return { source, resolvedSource: candidate, publicUrl, status: "downloaded" as const };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        await rm(temporary, { force: true });
      }
    }
  }
  return { source, resolvedSource: null, publicUrl, status: "failed" as const, error: lastError };
}

async function main() {
  await mkdir(outputRoot, { recursive: true });
  const urls = await collectUrls();
  const results = [];
  for (const [index, source] of urls.entries()) {
    const result = await download(source);
    results.push(result);
    console.log(`[${index + 1}/${urls.length}] ${result.status.toUpperCase()} ${result.publicUrl}`);
  }
  const manifest = { generatedAt: new Date().toISOString(), policy: "current-site-images", hierarchy: "wp-content/uploads/YYYY/MM", total: results.length, downloaded: results.filter((item) => item.status === "downloaded").length, skipped: results.filter((item) => item.status === "skipped").length, failed: results.filter((item) => item.status === "failed").length, items: results };
  await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  if (manifest.failed) throw new Error(`${manifest.failed} current site images could not be downloaded. See manifest.json.`);
  console.log(`Site images ready: ${manifest.total} files, 0 failures.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
