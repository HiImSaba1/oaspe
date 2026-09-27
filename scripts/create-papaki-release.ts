import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import AdmZip from "adm-zip";

const root = join(import.meta.dirname, "..");
const outputRoot = join(root, ".artifacts", "release");
const archivePath = join(outputRoot, "oaspe-papaki-release.zip");
const checksumPath = `${archivePath}.sha256.txt`;
const excludedDirectories = new Set([".git", ".next", ".next-playwright", "node_modules", ".artifacts", "test-results", "playwright-report", "coverage", "tests", "tmp"]);
const excludedRootFiles = new Set(["next-env.d.ts", "tsconfig.tsbuildinfo"]);

function shouldExclude(relativePath: string) {
  const normalized = relativePath.replaceAll("\\", "/");
  const parts = normalized.split("/");
  if (parts.some((part) => excludedDirectories.has(part))) return true;
  if (normalized === "public/wp-images" || normalized.startsWith("public/wp-images/") || normalized === "public/images/wp-content" || normalized.startsWith("public/images/wp-content/")) return true;
  const filename = basename(normalized);
  if (parts.length === 1 && excludedRootFiles.has(filename)) return true;
  if (parts.length === 1 && filename.startsWith(".env") && filename !== ".env.example") return true;
  if (/\.(xml|log)$/i.test(filename)) return true;
  if (normalized === "public/images/wordpress/manifest.json" || normalized === "public/images/wordpress/failures.json") return true;
  return false;
}

async function filesBelow(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const target = join(directory, entry.name);
    const relativePath = relative(root, target);
    if (shouldExclude(relativePath)) continue;
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) files.push(...await filesBelow(target));
    else if (entry.isFile()) files.push(target);
  }
  return files;
}

async function main() {
  await mkdir(outputRoot, { recursive: true });
  await rm(archivePath, { force: true });
  await rm(checksumPath, { force: true });
  const zip = new AdmZip();
  const files = await filesBelow(root);
  for (const file of files) zip.addLocalFile(file, relative(root, file).replaceAll("\\", "/").split("/").slice(0, -1).join("/"));
  for (const required of ["package.json", "package-lock.json", ".node-version", "start.js", "next.config.ts", "scripts/migrate-production-database.ts", "database/migrations/002_simple_admin.sql", "database/migrations/003_sxetika_hero.sql"]) {
    if (!files.some((file) => relative(root, file).replaceAll("\\", "/") === required)) throw new Error(`Release is missing ${required}.`);
  }
  const forbidden = zip.getEntries().map((entry) => entry.entryName).filter((name) => name.includes("node_modules/") || name.includes(".next/") || (name.startsWith(".env") && name !== ".env.example") || name.endsWith("manifest.json"));
  if (forbidden.length) throw new Error(`Forbidden release entries: ${forbidden.join(", ")}`);
  zip.writeZip(archivePath);
  const archive = await readFile(archivePath);
  const checksum = createHash("sha256").update(archive).digest("hex").toUpperCase();
  await writeFile(checksumPath, `${checksum}  ${basename(archivePath)}\n`, "utf8");
  const size = (await stat(archivePath)).size;
  console.log(`Release archive: ${archivePath}`);
  console.log(`Files: ${files.length}; bytes: ${size}; SHA-256: ${checksum}`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
