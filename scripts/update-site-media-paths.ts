import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const sourceRoots = [join(root, "src")];
const extensions = new Set([".ts", ".tsx", ".css", ".json"]);

async function collect(directory: string): Promise<string[]> {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) return collect(target);
    const extension = entry.name.slice(entry.name.lastIndexOf("."));
    return extensions.has(extension) ? [target] : [];
  }));
  return nested.flat();
}

async function main() {
  const files = (await Promise.all(sourceRoots.map(collect))).flat();
  let changedFiles = 0;
  let changedReferences = 0;
  for (const file of files) {
    const before = await readFile(file, "utf8");
    const matches = before.match(/\/images\/wp-content\/uploads\//g) ?? [];
    if (!matches.length) continue;
    const after = before.replaceAll("/images/wp-content/uploads/", "/images/wordpress/");
    await writeFile(file, after, "utf8");
    changedFiles += 1;
    changedReferences += matches.length;
    console.log(`UPDATED ${file.slice(root.length + 1)} (${matches.length})`);
  }
  console.log(`Complete: ${changedReferences} references updated in ${changedFiles} files.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
