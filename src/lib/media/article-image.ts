import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

const uploadPrefix = "https://oaspe.org/wp-content/uploads/";

export function articleImageSrc(source: string) {
  if (!source.startsWith(uploadPrefix)) return source;
  const relative = source.slice(uploadPrefix.length).split("/").map((segment) => decodeURIComponent(segment));
  const localPath = path.join(process.cwd(), "public", "images", "wordpress", ...relative);
  return existsSync(localPath) ? `/images/wordpress/${relative.map(encodeURIComponent).join("/")}` : source;
}
