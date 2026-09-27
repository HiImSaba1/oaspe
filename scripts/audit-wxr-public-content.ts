import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { createInterface } from "node:readline";
import { articles } from "../src/data/articles";
import { parseWxrItem, type WxrRecord } from "../src/lib/migration/wxr";

type AuditedRecord = Pick<WxrRecord, "wordpressId" | "postType" | "status" | "title" | "slug" | "publishedAt" | "taxonomy" | "quarantineReasons"> & {
  wordCount: number;
  currentRoute: string | null;
  matchMethod: "slug" | "title" | null;
};

const injectedReasons = new Set(["suspicious-bulk-timestamp", "seo-spam-keyword"]);
const publicPageMap: Record<string, string | null> = {
  home: "/",
  "about-us": "/sxetika",
  "our-target": "/skopos",
  blog: "/arthra",
  "contact-us": "/epikoinonia",
  dwrees: "/dwrees",
  "oroi-chrisis": "/oroi-chrisis",
  "cookie-policy": "/cookie-policy",
  "coming-soon-dark": null,
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("el-GR").replace(/[^a-z0-9α-ω]+/g, " ").trim();
}

function countWords(html: string) {
  const text = html.replace(/<[^>]*>/g, " ").replace(/&[a-z0-9#]+;/gi, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

function markdownCell(value: string) {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
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
  const outputDir = resolve(process.argv[3] ?? ".artifacts/content-audit");
  const records = await readWxr(xmlPath);
  const publishedPosts = records.filter((record) => record.postType === "post" && record.status === "publish");
  const injectedPosts = publishedPosts.filter((record) => record.quarantineReasons.some((reason) => injectedReasons.has(reason)));
  const candidatePosts = publishedPosts.filter((record) => !record.quarantineReasons.some((reason) => injectedReasons.has(reason)));
  const currentBySlug = new Map(articles.map((article) => [article.slug, article]));
  const currentByTitle = new Map(articles.map((article) => [normalize(article.title), article]));

  const auditedPosts: AuditedRecord[] = candidatePosts.map((record) => {
    const slugMatch = currentBySlug.get(record.slug);
    const titleMatch = currentByTitle.get(normalize(record.title));
    const match = slugMatch ?? titleMatch;
    const matchMethod: AuditedRecord["matchMethod"] = slugMatch ? "slug" : titleMatch ? "title" : null;
    return {
      wordpressId: record.wordpressId,
      postType: record.postType,
      status: record.status,
      title: record.title,
      slug: record.slug,
      publishedAt: record.publishedAt,
      taxonomy: record.taxonomy,
      quarantineReasons: record.quarantineReasons.filter((reason) => !injectedReasons.has(reason)),
      wordCount: countWords(record.sanitizedHtml),
      currentRoute: match ? `/arthra/${match.slug}` : null,
      matchMethod,
    };
  }).sort((left, right) => (right.publishedAt ?? "").localeCompare(left.publishedAt ?? ""));

  const sourceCandidateSlugs = new Set(auditedPosts.flatMap((record) => record.currentRoute ? [record.currentRoute.split("/").at(-1)!] : []));
  const currentArticlesMissingFromXml = articles.filter((article) => !sourceCandidateSlugs.has(article.slug)).map((article) => ({ slug: article.slug, title: article.title }));
  const pages = records.filter((record) => record.postType === "page" && record.status === "publish").map((record) => ({
    wordpressId: record.wordpressId,
    title: record.title,
    slug: record.slug,
    route: publicPageMap[record.slug] ?? null,
    excludedIntentionally: record.slug === "coming-soon-dark",
    wordCount: countWords(record.sanitizedHtml),
    quarantineReasons: record.quarantineReasons,
  }));
  const reasonCounts: Record<string, number> = {};
  for (const record of injectedPosts) for (const reason of record.quarantineReasons) reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;

  const summary = {
    xmlItems: records.length,
    publishedPostRecords: publishedPosts.length,
    confirmedInjectedPosts: injectedPosts.length,
    genuinePostCandidates: candidatePosts.length,
    genuineCandidatesRepresentedOnSite: auditedPosts.filter((record) => record.currentRoute).length,
    genuineCandidatesNotRepresentedOnSite: auditedPosts.filter((record) => !record.currentRoute).length,
    currentSiteArticles: articles.length,
    currentArticlesMissingFromXml: currentArticlesMissingFromXml.length,
    publishedPages: pages.length,
    mappedPublicPages: pages.filter((page) => page.route).length,
    intentionallyExcludedPages: pages.filter((page) => page.excludedIntentionally).length,
  };
  const report = {
    generatedAt: new Date().toISOString(),
    source: basename(xmlPath),
    mode: "read-only",
    summary,
    injectedReasonCounts: reasonCounts,
    currentArticlesMissingFromXml,
    genuinePostCandidates: auditedPosts,
    publishedPages: pages,
    safety: { databaseWrites: false, sourceWrites: false, mediaDownloads: false, publishing: false },
  };

  const candidateRows = auditedPosts.map((record) => `| ${record.wordpressId} | ${markdownCell(record.publishedAt ?? "")} | ${markdownCell(record.title)} | \`${markdownCell(record.slug)}\` | ${record.wordCount} | ${record.currentRoute ? `\`${record.currentRoute}\`` : "REVIEW"} | ${record.quarantineReasons.length ? markdownCell(record.quarantineReasons.join(", ")) : "-"} |`).join("\n");
  const pageRows = pages.map((page) => `| ${page.wordpressId} | ${markdownCell(page.title)} | \`${markdownCell(page.slug)}\` | ${page.wordCount} | ${page.route ? `\`${page.route}\`` : page.excludedIntentionally ? "EXCLUDED" : "REVIEW"} |`).join("\n");
  const markdown = `# OASPE WXR public-content audit\n\nGenerated: ${report.generatedAt}\n\n## Summary\n\n- XML items: ${summary.xmlItems}\n- Published records whose WordPress type is post: ${summary.publishedPostRecords}\n- Confirmed injected/spam posts: ${summary.confirmedInjectedPosts}\n- Genuine OASPE post candidates: ${summary.genuinePostCandidates}\n- Candidates represented on the current site: ${summary.genuineCandidatesRepresentedOnSite}\n- Candidates requiring review: ${summary.genuineCandidatesNotRepresentedOnSite}\n- Current site articles missing from the XML: ${summary.currentArticlesMissingFromXml}\n- Published WordPress pages: ${summary.publishedPages}\n- Mapped public pages: ${summary.mappedPublicPages}\n- Intentionally excluded utility pages: ${summary.intentionallyExcludedPages}\n\n## Genuine post candidates\n\n| ID | Published | Title | XML slug | Words | Current route | Legacy markup review |\n| ---: | --- | --- | --- | ---: | --- | --- |\n${candidateRows || "| - | - | None | - | 0 | - | - |"}\n\n## Published pages\n\n| ID | Title | XML slug | Words | Route |\n| ---: | --- | --- | ---: | --- |\n${pageRows}\n`;

  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outputDir, "wxr-public-content-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8"),
    writeFile(resolve(outputDir, "wxr-public-content-audit.md"), markdown, "utf8"),
  ]);
  process.stdout.write(`${JSON.stringify({ summary, output: outputDir, safety: report.safety }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
