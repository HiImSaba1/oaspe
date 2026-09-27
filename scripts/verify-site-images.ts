import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.join(import.meta.dirname, "..");
const sourceRoot = path.join(projectRoot, "src");
const publicRoot = path.join(projectRoot, "public");
const manifestPath = path.join(publicRoot, "images", "wp-content", "uploads", "manifest.json");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(target) : sourceExtensions.has(path.extname(entry.name)) ? [target] : [];
  }));
  return groups.flat();
}

async function main() {
  const referenced = new Set<string>();
  for (const file of await sourceFiles(sourceRoot)) {
    if (file.endsWith(`${path.sep}lib${path.sep}migration${path.sep}wxr.test.ts`)) continue;
    const content = await readFile(file, "utf8");
    for (const match of content.matchAll(/\/images\/wp-content\/uploads\/[^\s"'`)]+/g)) referenced.add(match[0]);
  }
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { policy: string; total: number; failed: number; items: Array<{ publicUrl: string }> };
  if (manifest.policy !== "current-site-images") throw new Error("Unexpected site-image manifest policy.");
  if (manifest.failed !== 0) throw new Error(`Site-image manifest contains ${manifest.failed} failures.`);
  if (manifest.total !== referenced.size) throw new Error(`Manifest has ${manifest.total} images but source references ${referenced.size}.`);
  const manifested = new Set(manifest.items.map((item) => item.publicUrl));
  for (const publicUrl of referenced) {
    if (!manifested.has(publicUrl)) throw new Error(`Image is absent from manifest: ${publicUrl}`);
    const target = path.join(publicRoot, ...publicUrl.split("/").filter(Boolean).map(decodeURIComponent));
    if ((await stat(target)).size === 0) throw new Error(`Image is empty: ${publicUrl}`);
  }
  console.log(JSON.stringify({ policy: manifest.policy, referenced: referenced.size, present: referenced.size, missing: 0, failed: 0 }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
