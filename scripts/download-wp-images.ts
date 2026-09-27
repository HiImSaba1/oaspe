import { createReadStream, createWriteStream } from "node:fs";
import { copyFile, mkdir, rename, rm, rmdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import { createInterface } from "node:readline";

const projectRoot = join(import.meta.dirname, "..");
const xmlPath = process.argv[2] ?? join(projectRoot, "..", "OASPE_FULL_WordPress.2026-09-23.xml");
const defaultOutputRoot = join(projectRoot, "public", "images", "wordpress");
const legacyOutputRoot = join(projectRoot, "public", "wp-images", "all_images_to_download_here");
const outputRoot = process.argv[3] ?? defaultOutputRoot;
const allowed = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".bmp", ".ico", ".tif", ".tiff", ".psd"]);

const reviewedFallbacks: Record<string, string[]> = {
  "/wp-content/uploads/2017/05/%CE%9F%CE%91%CE%A3%CE%A0%CE%95-LOGO.png": [
    "https://acadimies.gr/new/wp-content/uploads/2016/11/%CE%9F%CE%91%CE%A3%CE%A0%CE%95-LOGO.png",
  ],
  "/wp-content/uploads/2017/11/%CE%A6%CE%99%CE%9B%CE%99%CE%9A%CE%91-JPG-%CE%BC%CF%80%CE%BB%CE%B5.jpg": [
    "https://oaspe.org/wp-content/uploads/2017/11/%CE%A6%CE%99%CE%9B%CE%99%CE%9A%CE%91-JPG-%CE%BC%CF%80%CE%BB%CE%B5-1024x424.jpg",
  ],
  "/wp-content/uploads/2018/01/8o_golden_cup-2.jpg": [
    "https://oaspe.org/wp-content/uploads/2018/03/8o_golden_cup.jpg",
  ],
  "/wp-content/uploads/2019/01/PROTOXRONIA19_afisa-724x1024.jpg": [
    "https://oaspe.org/wp-content/uploads/2018/11/PROTOXRONIA19_afisa.jpg",
  ],
  "/wp-content/uploads/2021/11/service_1-1-1.jpg": [
    "https://oaspe.org/wp-content/uploads/sites/10/2021/11/service_1-1-1.jpg",
    "https://artemsemkin.com/kinsey/wp/wp-content/uploads/sites/10/2021/11/service_1-1-1.jpg",
  ],
  "/wp-content/uploads/2021/11/service_1-2-1.jpg": [
    "https://oaspe.org/wp-content/uploads/sites/10/2021/11/service_1-2-1.jpg",
    "https://artemsemkin.com/kinsey/wp/wp-content/uploads/sites/10/2021/11/service_1-2-1.jpg",
  ],
  "/wp-content/uploads/2021/11/service_1-3-1.jpg": [
    "https://oaspe.org/wp-content/uploads/sites/10/2021/11/service_1-3-1.jpg",
    "https://artemsemkin.com/kinsey/wp/wp-content/uploads/sites/10/2021/11/service_1-3-1.jpg",
  ],
};

// These source files are separate, successfully archived WXR attachments that
// represent the same identity/event as four originals no longer served by the
// legacy host. The manifest marks them as equivalents rather than originals.
const reviewedLocalEquivalents: Record<string, string> = {
  "/wp-content/uploads/2017/05/%CE%9F%CE%91%CE%A3%CE%A0%CE%95-LOGO.png": "2024/10/oaspe-logo-nobg.png",
  "/wp-content/uploads/2017/11/%CE%A6%CE%99%CE%9B%CE%99%CE%9A%CE%91-JPG-%CE%BC%CF%80%CE%BB%CE%B5.jpg": "2017/10/filika_sk_thess_oaspe_Newsletter.jpg",
  "/wp-content/uploads/2018/01/8o_golden_cup_afisa_1114new-724x1024.jpg": "2018/01/8o_golden_cup_afisa_1114new_s.jpg",
  "/wp-content/uploads/2018/10/PASXA_AFISA_2019-2-724x1024.jpg": "2019/01/12o_PASXA_AFISA_2019_NEW.jpg",
};

function safeSegment(value: string) { return decodeURIComponent(value).replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/[. ]+$/g, "") || "asset"; }
function extension(pathname: string) { const match = pathname.toLowerCase().match(/\.[a-z0-9]+$/); return match?.[0] ?? ""; }
async function exists(path: string) { try { return (await stat(path)).size > 0; } catch { return false; } }
async function pathExists(path: string) { try { await stat(path); return true; } catch { return false; } }

function candidateUrls(urlValue: string) {
  const source = new URL(urlValue);
  const candidates = [source.href];
  const originalPath = source.pathname.replace(/-\d+x\d+(?=\.[^.]+$)/, "");
  if (originalPath !== source.pathname) candidates.push(new URL(originalPath, source.origin).href);
  candidates.push(...(reviewedFallbacks[source.pathname] ?? []));
  return [...new Set(candidates)];
}

async function migrateLegacyFolder() {
  if (outputRoot !== defaultOutputRoot || !(await pathExists(legacyOutputRoot))) return;
  if (await pathExists(defaultOutputRoot)) {
    throw new Error(`Both legacy and new media folders exist. Keep one before retrying: ${legacyOutputRoot} and ${defaultOutputRoot}`);
  }
  await mkdir(dirname(defaultOutputRoot), { recursive: true });
  await rename(legacyOutputRoot, defaultOutputRoot);
  await rmdir(dirname(legacyOutputRoot));
  console.log(`MIGRATED ${legacyOutputRoot} -> ${defaultOutputRoot}`);
}

async function removeEmptyLegacyParent() {
  try {
    await rmdir(dirname(legacyOutputRoot));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT" && code !== "ENOTEMPTY") throw error;
  }
}

async function collectUrls() {
  const urls = new Set<string>();
  const lines = createInterface({ input: createReadStream(xmlPath, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of lines) {
    const candidates = line.match(/https?:\/\/(?:www\.)?oaspe\.org\/wp-content\/uploads\/[^<\s"'&]+/gi) ?? [];
    for (const candidate of candidates) {
      try {
        const url = new URL(candidate.replace(/\]\]>.*$/, ""));
        if (allowed.has(extension(url.pathname))) urls.add(url.href);
      } catch { /* malformed export URL */ }
    }
  }
  return [...urls];
}

async function download(urlValue: string) {
  const url = new URL(urlValue); const relative = url.pathname.split("/wp-content/uploads/")[1].split("/").map(safeSegment);
  const target = join(outputRoot, ...relative); await mkdir(dirname(target), { recursive: true });
  if (await exists(target)) return { url: urlValue, resolvedUrl: urlValue, path: target, status: "skipped" as const };
  const canonicalTarget = target.replace(/-\d+x\d+(?=\.[^.]+$)/, "");
  if (canonicalTarget !== target && await exists(canonicalTarget)) return { url: urlValue, resolvedUrl: `/images/wordpress/${relative.slice(0, -1).concat(basename(canonicalTarget)).join("/")}`, resolution: "deduplicated-to-original" as const, path: canonicalTarget, status: "skipped" as const };
  const temporary = `${target}.part`; let lastError = "Unknown error";
  for (const candidate of candidateUrls(urlValue)) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try { const response = await fetch(candidate, { signal: AbortSignal.timeout(30_000), headers: { "user-agent": "OASPE-WXR-Media-Migration/1.0" } }); if (!response.ok || !response.body) throw new Error(`HTTP ${response.status} from ${candidate}`); const source = Readable.fromWeb(response.body as unknown as NodeWebReadableStream); await pipeline(source, createWriteStream(temporary)); await rename(temporary, target); return { url: urlValue, resolvedUrl: candidate, path: target, status: "downloaded" as const }; } catch (error) { lastError = error instanceof Error ? error.message : String(error); await rm(temporary, { force: true }); }
    }
  }
  const equivalent = reviewedLocalEquivalents[url.pathname];
  if (equivalent) {
    const equivalentPath = join(outputRoot, ...equivalent.split("/"));
    if (await exists(equivalentPath)) {
      await copyFile(equivalentPath, target);
      return {
        url: urlValue,
        resolvedUrl: `/images/wordpress/${equivalent}`,
        resolution: "reviewed-local-equivalent" as const,
        path: target,
        status: "downloaded" as const,
      };
    }
    lastError = `Reviewed local equivalent is missing: ${equivalentPath}`;
  }
  return { url: urlValue, path: target, status: "failed" as const, error: lastError };
}

async function main() {
  await migrateLegacyFolder();
  await removeEmptyLegacyParent();
  await mkdir(outputRoot, { recursive: true });
  const urls = await collectUrls();
  const results: Awaited<ReturnType<typeof download>>[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const index = cursor++;
      const result = await download(urls[index]);
      results.push(result);
      console.log(`[${index + 1}/${urls.length}] ${result.status.toUpperCase()} ${basename(result.path)}`);
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  const manifest = { generatedAt: new Date().toISOString(), xmlPath, outputRoot, total: urls.length, downloaded: results.filter((item) => item.status === "downloaded").length, skipped: results.filter((item) => item.status === "skipped").length, failed: results.filter((item) => item.status === "failed").length, items: results.sort((a, b) => a.url.localeCompare(b.url)) };
  await writeFile(join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  if (manifest.failed) {
    await writeFile(join(outputRoot, "failures.json"), `${JSON.stringify(results.filter((item) => item.status === "failed"), null, 2)}\n`, "utf8");
    process.exitCode = 1;
  } else {
    await rm(join(outputRoot, "failures.json"), { force: true });
  }
  console.log(`Complete: ${manifest.downloaded} downloaded, ${manifest.skipped} already present, ${manifest.failed} failed.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
