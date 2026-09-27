import { createHash } from "node:crypto";
import sanitizeHtml from "sanitize-html";

export type WxrRecord = {
  wordpressId: number;
  postType: string;
  status: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  creator: string;
  parentWordpressId: number | null;
  attachmentUrl: string | null;
  mediaUrls: string[];
  taxonomy: Array<{ domain: string; slug: string; label: string }>;
  sanitizedHtml: string;
  contentHash: string;
  quarantineReasons: string[];
};

const activePatterns: Array<[RegExp, string]> = [
  [/<script\b/i, "script-element"], [/<iframe\b/i, "iframe-element"], [/<(?:object|embed)\b/i, "embedded-object"],
  [/<form\b/i, "form-element"], [/\son[a-z]+\s*=/i, "inline-event-handler"], [/javascript\s*:/i, "javascript-url"],
];

export function cdata(source: string, tag: string) { return source.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))?.[1]?.trim() ?? ""; }
export function textValue(source: string, tag: string) { return source.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.trim() ?? ""; }
export function quarantineReasons(html: string) { return activePatterns.filter(([pattern]) => pattern.test(html)).map(([, reason]) => reason); }

function integrityReasons(title: string, slug: string, publishedAt: string | null) {
  const reasons: string[] = [];
  const identity = `${title} ${slug}`.toLowerCase();
  if (publishedAt === "2026-05-21 07:05:58") reasons.push("suspicious-bulk-timestamp");
  if (/(?:casino|slots?|roulette|stoiximan|vavada|sportingbet|poker|free-spins|neacasino)/i.test(identity)) reasons.push("seo-spam-keyword");
  return reasons;
}

export function sanitizeLegacyHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "blockquote", "ul", "ol", "li", "h2", "h3", "h4", "h5", "a", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td", "span", "div"],
    allowedAttributes: { a: ["href", "title", "target", "rel"], img: ["src", "alt", "width", "height", "srcset", "sizes"], "*": ["class"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true) },
  }).trim();
}

function numberOrNull(value: string) { const parsed = Number(value); return Number.isInteger(parsed) && parsed >= 0 ? parsed : null; }
function decodeXml(value: string) { return value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#039;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">"); }

export function parseWxrItem(item: string): WxrRecord {
  const rawHtml = cdata(item, "content:encoded");
  const sanitizedHtml = sanitizeLegacyHtml(rawHtml);
  const wordpressId = numberOrNull(textValue(item, "wp:post_id"));
  if (wordpressId === null) throw new Error("WXR item is missing a valid wp:post_id.");
  const mediaUrls = [...new Set([...item.matchAll(/https?:\/\/(?:www\.)?oaspe\.org\/wp-content\/uploads\/[^<\s"'&]+/gi)].map((match) => decodeXml(match[0].replace(/\\\//g, "/"))))];
  const taxonomy = [...item.matchAll(/<category domain="([^"]+)" nicename="([^"]*)"><!\[CDATA\[([\s\S]*?)\]\]><\/category>/g)].map((match) => ({ domain: match[1], slug: match[2], label: match[3] }));
  const date = cdata(item, "wp:post_date_gmt") || cdata(item, "wp:post_date");
  const publishedAt = date && !date.startsWith("0000-00-00") ? date : null;
  const title = cdata(item, "title");
  const slug = cdata(item, "wp:post_name");
  return {
    wordpressId, postType: cdata(item, "wp:post_type"), status: cdata(item, "wp:status"), title, slug,
    publishedAt, creator: cdata(item, "dc:creator"), parentWordpressId: numberOrNull(textValue(item, "wp:post_parent")),
    attachmentUrl: cdata(item, "wp:attachment_url") || null, mediaUrls, taxonomy, sanitizedHtml,
    contentHash: createHash("sha256").update(sanitizedHtml).digest("hex"), quarantineReasons: [...new Set([...quarantineReasons(rawHtml), ...integrityReasons(title, slug, publishedAt)])],
  };
}
