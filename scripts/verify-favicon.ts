import { join } from "node:path";
import sharp from "sharp";

async function main() {
  const icon = join(import.meta.dirname, "..", "src", "app", "icon.png");
  const image = sharp(icon);
  const metadata = await image.metadata();
  if (metadata.width !== 512 || metadata.height !== 512 || metadata.format !== "png") throw new Error("Favicon must be a 512x512 PNG.");
  const corner = await image.extract({ left: 0, top: 0, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
  if (corner[0] < 250 || corner[1] < 250 || corner[2] < 250) throw new Error("Favicon must have a visible white background.");
  console.log("PASS: 512x512 OASPE favicon with white background");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
