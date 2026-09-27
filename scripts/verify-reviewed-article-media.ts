import { readFile, stat } from "node:fs/promises";
import path from "node:path";

type Manifest = { policy: string; total: number; failed: number; items: Array<{ localUrl: string }> };

async function main() {
  const manifestPath = path.join(process.cwd(), "public", "wp-images", "articles", "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;
  if (manifest.policy !== "reviewed-article-media-only") throw new Error("Unexpected media manifest policy.");
  if (manifest.total !== 6 || manifest.items.length !== 6) throw new Error(`Expected 6 reviewed article images, found ${manifest.total}.`);
  if (manifest.failed !== 0) throw new Error("Reviewed media manifest contains failures.");
  for (const item of manifest.items) {
    const filePath = path.join(process.cwd(), "public", ...item.localUrl.split("/").filter(Boolean).map(decodeURIComponent));
    if ((await stat(filePath)).size === 0) throw new Error(`Empty media file: ${item.localUrl}`);
  }
  console.log(JSON.stringify({ policy: manifest.policy, reviewedFiles: 6, missing: 0, failed: 0 }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
