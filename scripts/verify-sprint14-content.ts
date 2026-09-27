import { existsSync } from "node:fs";
import { resolve } from "node:path";
import source from "../src/data/generated/wxr-greek-content.json";
import { articles } from "../src/data/articles";

function fail(message: string): never { throw new Error(message); }

function main() {
  if (source.summary.approvedCandidates !== 58 || articles.length !== 58) fail(`Expected exactly 58 genuine articles; source=${source.summary.approvedCandidates}, public=${articles.length}.`);
  if (source.safety.injectedRecordsIncluded) fail("The generated dataset must never include injected records.");
  if (new Set(articles.map((article) => article.slug)).size !== articles.length) fail("Article slugs must be unique.");
  const combined = articles.map((article) => `${article.title} ${article.slug} ${article.contentHtml}`).join("\n");
  if (/(?:casino|slots?|roulette|vavada|free-spins)/i.test(combined)) fail("Injected SEO vocabulary was found in the public article dataset.");
  if (/\[(?:\/?vc_|\/?us_|\/?caption|\/?gallery)/i.test(combined)) fail("Legacy WordPress shortcodes remain in public article content.");
  if (/<img\b[^>]+src=["']https?:/i.test(combined)) fail("Remote inline article images remain in the public dataset.");
  const missingImages = articles.filter((article) => !existsSync(resolve("public", article.image.replace(/^\//, ""))));
  if (missingImages.length) fail(`Missing local hero images: ${missingImages.map((article) => article.slug).join(", ")}`);
  const totalWords = articles.reduce((total, article) => total + article.wordCount, 0);
  if (totalWords < 40_000) fail(`Expected at least 40,000 reviewed source words; found ${totalWords}.`);
  process.stdout.write(`Sprint 14 content contract: PASS (58 genuine articles, ${totalWords} words, 1,000 injected records excluded, all hero images local).\n`);
}

try { main(); } catch (error) { process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`); process.exitCode = 1; }
