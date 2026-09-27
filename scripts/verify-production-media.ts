import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const projectRoot = join(import.meta.dirname, "..");
const sourceRoot = join(projectRoot, "src");
const publicRoot = join(projectRoot, "public");
const sourceExtensions = new Set([".ts", ".tsx", ".css"]);
const sizedPattern = /-\d+x\d+(?=\.[^.]+$)/;

async function filesBelow(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const target = join(root, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  }))).flat();
}

async function isFile(target: string) {
  try { return (await stat(target)).isFile(); } catch { return false; }
}

async function main() {
  const references = new Set<string>();
  const stale: string[] = [];
  for (const file of (await filesBelow(sourceRoot)).filter((item) => sourceExtensions.has(extname(item)))) {
    const content = await readFile(file, "utf8");
    if (content.includes("/images/wp-content/uploads/") || content.includes("/wp-images/")) stale.push(file);
    for (const match of content.matchAll(/\/images\/wordpress\/[A-Za-z0-9_./-]+/g)) references.add(match[0]);
  }
  if (stale.length) throw new Error(`Obsolete media paths remain in: ${stale.join(", ")}`);

  const missing: string[] = [];
  const redundant: string[] = [];
  for (const reference of references) {
    const target = resolve(publicRoot, reference.slice(1));
    if (!target.startsWith(resolve(publicRoot))) throw new Error(`Unsafe media reference: ${reference}`);
    if (!(await isFile(target))) missing.push(reference);
    if (sizedPattern.test(target) && await isFile(target.replace(sizedPattern, ""))) redundant.push(reference);
  }
  if (missing.length) throw new Error(`Missing production media:\n${missing.join("\n")}`);
  if (redundant.length) throw new Error(`Source still references removable WordPress derivatives:\n${redundant.join("\n")}`);
  console.log(`Production media contract: PASS (${references.size} local references, 0 missing, 0 redundant derivatives).`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
