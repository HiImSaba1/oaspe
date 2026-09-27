import { readdir, readFile, rm, stat, writeFile, mkdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const projectRoot = join(import.meta.dirname, "..");
const mediaRoot = resolve(projectRoot, "public", "images", "wordpress");
const sourceRoot = resolve(projectRoot, "src");
const artifactRoot = resolve(projectRoot, ".artifacts", "media-dedupe");
const apply = process.argv.includes("--apply");
const sizedPattern = /-\d+x\d+(?=\.[^.]+$)/;
const sourceExtensions = new Set([".ts", ".tsx", ".css", ".json"]);

async function filesBelow(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const target = join(root, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  }))).flat();
}

function assertInside(target: string, root: string) {
  const resolved = resolve(target);
  if (resolved === root || !resolved.startsWith(`${root}\\`)) throw new Error(`Refusing unsafe media target: ${resolved}`);
}

async function exists(target: string) { try { return (await stat(target)).isFile(); } catch { return false; } }

async function main() {
  const mediaFiles = (await filesBelow(mediaRoot)).filter((file) => !["manifest.json", "failures.json"].includes(file.split("\\").at(-1) ?? ""));
  const pairs: Array<{ derivative: string; original: string; derivativeUrl: string; originalUrl: string }> = [];
  const preserved: string[] = [];
  for (const derivative of mediaFiles.filter((file) => sizedPattern.test(file))) {
    const original = derivative.replace(sizedPattern, "");
    const derivativeUrl = `/images/wordpress/${relative(mediaRoot, derivative).replaceAll("\\", "/")}`;
    if (await exists(original)) pairs.push({ derivative, original, derivativeUrl, originalUrl: `/images/wordpress/${relative(mediaRoot, original).replaceAll("\\", "/")}` });
    else preserved.push(derivativeUrl);
  }

  const sourceFiles = (await filesBelow(sourceRoot)).filter((file) => sourceExtensions.has(extname(file)));
  const sourceUpdates: Array<{ file: string; from: string; to: string }> = [];
  for (const file of sourceFiles) {
    const content = await readFile(file, "utf8");
    for (const pair of pairs) if (content.includes(pair.derivativeUrl)) sourceUpdates.push({ file: relative(projectRoot, file), from: pair.derivativeUrl, to: pair.originalUrl });
  }

  const report = { mode: apply ? "apply" : "plan", generatedAt: new Date().toISOString(), totalMedia: mediaFiles.length, removableDerivatives: pairs.length, preservedSizedFiles: preserved.length, sourceUpdates, preserved };
  await mkdir(artifactRoot, { recursive: true });
  await writeFile(join(artifactRoot, apply ? "apply.json" : "plan.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Media: ${mediaFiles.length}; removable derivatives: ${pairs.length}; preserved sized files: ${preserved.length}; source references to update: ${sourceUpdates.length}.`);
  if (!apply) { console.log(`PLAN ONLY: ${join(artifactRoot, "plan.json")}`); return; }

  for (const file of sourceFiles) {
    const before = await readFile(file, "utf8");
    let after = before;
    for (const pair of pairs) after = after.replaceAll(pair.derivativeUrl, pair.originalUrl);
    if (after !== before) await writeFile(file, after, "utf8");
  }

  const manifestPath = join(mediaRoot, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { items: Array<Record<string, unknown> & { path?: string }> };
  const canonicalByAbsolute = new Map(pairs.map((pair) => [resolve(pair.derivative), pair]));
  manifest.items = manifest.items.map((item) => {
    if (!item.path) return item;
    const pair = canonicalByAbsolute.get(resolve(item.path));
    return pair ? { ...item, path: pair.original, canonicalPath: pair.originalUrl, resolution: "deduplicated-to-original", status: "skipped" } : item;
  });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  for (const pair of pairs) { assertInside(pair.derivative, mediaRoot); await rm(pair.derivative); }
  console.log(`APPLIED: removed ${pairs.length} redundant derivatives and retained ${mediaFiles.length - pairs.length} media files.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
