import { describe, expect, it } from "vitest";
import { parseWxrItem, quarantineReasons, sanitizeLegacyHtml } from "./wxr";

describe("WXR migration boundary", () => {
  it("removes executable markup and unsafe URL schemes", () => {
    const dirty = '<p onclick="alert(1)">Κείμενο</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>';
    const clean = sanitizeLegacyHtml(dirty);
    expect(clean).toContain("Κείμενο"); expect(clean).not.toMatch(/script|onclick|javascript:/i);
    expect(quarantineReasons(dirty)).toEqual(expect.arrayContaining(["script-element", "inline-event-handler", "javascript-url"]));
  });

  it("normalizes identity, taxonomy and media without database work", () => {
    const item = `<item><title><![CDATA[Δοκιμή]]></title><dc:creator><![CDATA[dora]]></dc:creator><content:encoded><![CDATA[<h2>Ασφαλές</h2>]]></content:encoded><wp:post_id>42</wp:post_id><wp:post_date_gmt><![CDATA[2024-01-02 03:04:05]]></wp:post_date_gmt><wp:post_name><![CDATA[dokimi]]></wp:post_name><wp:status><![CDATA[publish]]></wp:status><wp:post_parent>0</wp:post_parent><wp:post_type><![CDATA[post]]></wp:post_type><category domain="category" nicename="arthra"><![CDATA[Άρθρα]]></category><img src="https://oaspe.org/wp-content/uploads/2024/01/test.jpg"></item>`;
    const record = parseWxrItem(item);
    expect(record).toMatchObject({ wordpressId: 42, slug: "dokimi", postType: "post", status: "publish", creator: "dora", quarantineReasons: [] });
    expect(record.taxonomy).toEqual([{ domain: "category", slug: "arthra", label: "Άρθρα" }]); expect(record.mediaUrls).toEqual(["https://oaspe.org/wp-content/uploads/2024/01/test.jpg"]);
  });

  it("quarantines the evidence-backed injected bulk post cluster", () => {
    const item = `<item><title><![CDATA[slots palace review]]></title><content:encoded><![CDATA[plain SEO content]]></content:encoded><wp:post_id>9999</wp:post_id><wp:post_date><![CDATA[2026-05-21 07:05:58]]></wp:post_date><wp:post_name><![CDATA[slots-palace-review-019]]></wp:post_name><wp:post_type><![CDATA[post]]></wp:post_type><wp:status><![CDATA[publish]]></wp:status><wp:post_parent>0</wp:post_parent></item>`;
    const record = parseWxrItem(item);
    expect(record.quarantineReasons).toEqual(expect.arrayContaining(["suspicious-bulk-timestamp", "seo-spam-keyword"]));
  });
});
