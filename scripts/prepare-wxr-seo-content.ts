import { createReadStream, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { parseWxrItem, type WxrRecord } from "../src/lib/migration/wxr";

const injectedReasons = new Set(["suspicious-bulk-timestamp", "seo-spam-keyword"]);

function plainText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function description(text: string, limit = 158) {
  if (text.length <= limit) return text;
  const shortened = text.slice(0, limit + 1).replace(/\s+\S*$/, "").trim();
  return `${shortened}…`;
}

function localMediaPath(url: string) {
  try {
    const pathname = decodeURIComponent(new URL(url).pathname);
    const marker = "/wp-content/uploads/";
    const index = pathname.toLowerCase().indexOf(marker);
    return index >= 0 ? `/images/wordpress/${pathname.slice(index + marker.length)}` : null;
  } catch {
    return null;
  }
}

function existingLocalMedia(path: string, publicRoot: string) {
  const direct = resolve(publicRoot, path.replace(/^\//, ""));
  if (existsSync(direct)) return path;
  const original = path.replace(/-\d+x\d+(?=\.[^.]+$)/, "");
  return existsSync(resolve(publicRoot, original.replace(/^\//, ""))) ? original : null;
}

function cleanLegacyHtml(html: string, publicRoot: string) {
  return html
    .replace(/\[(?:\/?vc_[^\]]*|\/?us_[^\]]*|\/?caption[^\]]*|\/?gallery[^\]]*)\]/gi, "")
    .replace(/<img\b[^>]*\bsrc=(['"])(.*?)\1[^>]*>/gi, (tag, _quote: string, source: string) => {
      const candidate = localMediaPath(source);
      const local = candidate ? existingLocalMedia(candidate, publicRoot) : null;
      if (!local) return "";
      return tag
        .replace(/\bsrc=(['"])(.*?)\1/i, `src="${local}"`)
        .replace(/\s+srcset=(['"])(.*?)\1/gi, "")
        .replace(/\s+sizes=(['"])(.*?)\1/gi, "");
    })
    .replace(/(?:\r?\n){3,}/g, "\n\n")
    .trim();
}

async function readWxr(xmlPath: string) {
  const records: WxrRecord[] = [];
  let inItem = false;
  let item = "";
  const reader = createInterface({ input: createReadStream(xmlPath, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of reader) {
    if (!inItem && line.includes("<item>")) { inItem = true; item = `${line}\n`; continue; }
    if (!inItem) continue;
    item += `${line}\n`;
    if (!line.includes("</item>")) continue;
    records.push(parseWxrItem(item));
    inItem = false;
    item = "";
  }
  return records;
}

async function main() {
  const xmlPath = resolve(process.argv[2] ?? "../OASPE_FULL_WordPress.2026-09-23.xml");
  const outputDir = resolve(process.argv[3] ?? ".artifacts/sprint14-content-seo");
  const publicRoot = resolve("public");
  const records = await readWxr(xmlPath);
  const articles = records
    .filter((record) => record.postType === "post" && record.status === "publish")
    .filter((record) => !record.quarantineReasons.some((reason) => injectedReasons.has(reason)))
    .map((record) => {
      const contentHtml = cleanLegacyHtml(record.sanitizedHtml, publicRoot);
      const text = plainText(contentHtml);
      const categories = record.taxonomy.filter((term) => term.domain === "category").map((term) => term.label);
      const tags = record.taxonomy.filter((term) => term.domain === "post_tag").map((term) => term.label);
      const media = record.mediaUrls.map(localMediaPath).filter((value): value is string => Boolean(value));
      const localMedia = [...new Set(media.map((path) => existingLocalMedia(path, publicRoot)).filter((path): path is string => Boolean(path)))];
      return {
        wordpressId: record.wordpressId,
        slug: record.slug,
        title: record.title,
        publishedAt: record.publishedAt,
        author: record.creator || "ΟΑΣΠΕ",
        categories,
        tags,
        description: description(text),
        wordCount: text ? text.split(" ").length : 0,
        contentHtml,
        mediaCandidates: media,
        localMedia,
        heroImage: localMedia[0] ?? null,
        reviewFlags: record.quarantineReasons,
      };
    })
    .sort((left, right) => (right.publishedAt ?? "").localeCompare(left.publishedAt ?? ""));

  const report = {
    generatedAt: new Date().toISOString(),
    mode: "review-only",
    summary: {
      approvedCandidates: articles.length,
      withLocalHeroImage: articles.filter((article) => article.heroImage).length,
      withoutLocalHeroImage: articles.filter((article) => !article.heroImage).length,
      requiringMarkupReview: articles.filter((article) => article.reviewFlags.length).length,
      totalGreekContentWords: articles.reduce((total, article) => total + article.wordCount, 0),
    },
    articles,
    safety: { databaseWrites: false, sourceWrites: false, publishing: false, injectedRecordsIncluded: false },
  };

  const checklist = articles.map((article) => `- [ ] ${article.title} — ${article.wordCount} words — ${article.heroImage ? "local image" : "image needed"}${article.reviewFlags.length ? ` — review: ${article.reviewFlags.join(", ")}` : ""}`).join("\n");
  const markdown = `# Sprint 14 — Greek content and SEO review\n\nGenerated: ${report.generatedAt}\n\n## Extraction summary\n\n- Genuine article candidates: ${report.summary.approvedCandidates}\n- Total source words: ${report.summary.totalGreekContentWords}\n- Articles with a local hero candidate: ${report.summary.withLocalHeroImage}\n- Articles needing an image decision: ${report.summary.withoutLocalHeroImage}\n- Articles needing markup review: ${report.summary.requiringMarkupReview}\n- Injected records included: no\n\n## Editorial checklist\n\n${checklist}\n`;

  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outputDir, "reviewed-greek-content.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8"),
    writeFile(resolve(outputDir, "editorial-checklist.md"), markdown, "utf8"),
  ]);
  process.stdout.write(`${JSON.stringify({ summary: report.summary, output: outputDir, safety: report.safety }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
