import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

async function main() {
  const root = join(import.meta.dirname, "..");
  const source = join(root, "public", "images", "wordpress", "2024", "10", "oaspe-logo-nobg.png");
  const output = join(root, "src", "app", "icon.png");
  const logo = await sharp(await readFile(source)).resize(420, 420, { fit: "inside", withoutEnlargement: true }).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: "#ffffff" } }).composite([{ input: logo, gravity: "centre" }]).png({ compressionLevel: 9 }).toFile(output);
  console.log(`Created ${output}`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
