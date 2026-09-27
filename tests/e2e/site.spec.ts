import { expect, test } from "@playwright/test";

async function dismissDecorativeIntro(page: import("@playwright/test").Page) {
  await page.locator("html[data-hydrated='true']").waitFor({ state: "attached" });
  await page.evaluate(() => {
    const preloader = document.querySelector<HTMLElement>("[data-preloader]");
    if (preloader) {
      preloader.style.display = "none";
      preloader.dataset.complete = "true";
    }
    document.documentElement.style.overflow = "";
    document.documentElement.dataset.routeReady = "true";
    window.dispatchEvent(new CustomEvent("oaspe:loader-complete"));
  });
}

test("Greek-first homepage has stable responsive media and no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await dismissDecorativeIntro(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "el");
  await expect(page.getByRole("heading", { level: 1, name: /Ανάπτυξη ακαδημιών/ })).toBeVisible();
  await expect(page.locator(".home-pixel-grid")).toHaveCount(0);
  const heroImage = page.locator(".hero-image");
  await expect(heroImage).toBeVisible();
  expect((await heroImage.boundingBox())?.height).toBeGreaterThan(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("keyboard users can bypass the animated site chrome", async ({ page }) => {
  await page.goto("/");
  await dismissDecorativeIntro(page);
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Μετάβαση στο κύριο περιεχόμενο" });
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("homepage presents three editorial work cards linked to XML-derived projects", async ({ page }) => {
  await page.goto("/");
  await dismissDecorativeIntro(page);
  const works = page.locator(".home-works");
  await expect(works.getByRole("heading", { level: 2, name: /Πρωτοβουλίες με διάρκεια/ })).toBeVisible();
  await expect(works.locator(".home-work")).toHaveCount(3);
  await expect(works.getByRole("link", { name: /Προβολή έργου: Golden Cup/ })).toHaveAttribute("href", "/erga/golden-cup");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("homepage services use the Sabaweb hover-image pattern", async ({ page }, testInfo) => {
  await page.goto("/");
  await dismissDecorativeIntro(page);
  await expect(page.locator("[data-service-row]")).toHaveCount(4);
  await expect(page.locator(".service-preview-frame")).toHaveCount(4);
  const inlineImage = page.locator(".service-inline-media").first();
  const preview = page.locator(".service-preview");
  if (testInfo.project.name === "mobile-chromium") {
    await expect(inlineImage).toBeVisible();
    await expect(preview).toBeHidden();
    return;
  }
  await expect(inlineImage).toBeHidden();
  await page.locator("[data-service-row]").nth(1).hover();
  await expect.poll(async () => Number(await preview.evaluate((element) => getComputedStyle(element).opacity))).toBeGreaterThan(0.9);
  const bounds = await preview.boundingBox();
  const viewport = page.viewportSize();
  expect(bounds).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(20);
  expect(bounds!.y).toBeGreaterThanOrEqual(20);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport!.width - 20);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport!.height - 20);
});

test("full-screen menu opens, exposes navigation and closes with Escape", async ({ page }) => {
  await page.goto("/");
  await dismissDecorativeIntro(page);
  const toggle = page.getByRole("button", { name: "Άνοιγμα μενού" });
  await toggle.click();
  await expect(page.getByRole("button", { name: "Κλείσιμο μενού" })).toHaveAttribute("aria-expanded", "true");
  const navigation = page.getByRole("navigation", { name: "Κύρια πλοήγηση" });
  await expect(navigation).toBeVisible();
  await expect(page.locator("#site-menu")).toHaveCSS("background-color", "rgb(243, 240, 233)");
  await expect(navigation.getByRole("link", { name: "Σκοπός" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Σκοπός" })).toHaveCSS("color", "rgb(23, 23, 21)");
  await expect(page.locator("#site-menu .menu-word")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Άνοιγμα μενού" })).toBeFocused();
  await expect(page.locator("#site-menu")).toHaveAttribute("aria-hidden", "true");
});

test("XML-derived public routes are reachable", async ({ request }) => {
  for (const route of ["/sxetika", "/skopos", "/erga", "/erga/golden-cup", "/arthra", "/dwrees", "/oroi-chrisis", "/epikoinonia"]) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
  }
});

test("SEO discovery and private admin indexing boundaries are explicit", async ({ page, request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const robotsText = await robots.text();
  expect(robotsText).toContain("Disallow: /admin/");
  expect(robotsText).toContain("Disallow: /api/");
  expect(robotsText).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const sitemapText = await sitemap.text();
  expect(sitemapText).toMatch(/<loc>https?:\/\/[^<]+\/arthra<\/loc>/);
  expect(sitemapText).toMatch(/<loc>https?:\/\/[^<]+\/erga\/golden-cup<\/loc>/);
  expect(sitemapText).toContain("/arthra/pos-epilegoyme-akadimia-podosfairoy</loc>");
  expect((sitemapText.match(/\/arthra\//g) ?? []).length).toBe(58);
  expect(sitemapText).not.toContain("/admin");

  await page.goto("/skopos");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/skopos$/);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "el_GR");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/images\/wordpress\/2016\/02\/skopos_17\.jpg$/);
  for (const route of ["/", "/sxetika", "/skopos", "/erga", "/arthra", "/dwrees", "/epikoinonia", "/oroi-chrisis", "/cookie-policy", "/erga/golden-cup", "/arthra/13o-therino-toyrnoya-golden-cup-generation-next"]) {
    const response = await request.get(route, { headers: { "user-agent": "facebookexternalhit/1.1" } });
    const html = await response.text();
    expect(html, `${route} title`).toMatch(/<title>[^<]{3,}<\/title>/);
    expect(html, `${route} canonical`).toMatch(/<link rel="canonical" href="https?:\/\/[^\"]+"/);
    const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    expect(ogImage, `${route} og:image`).toBeTruthy();
    const imageResponse = await request.get(new URL(ogImage!).pathname);
    expect(imageResponse.status(), `${route} share image`).toBe(200);
  }
  await page.goto("/arthra/13o-therino-toyrnoya-golden-cup-generation-next");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute("content", /^2019-05-14/);
  await expect(page.locator(".page-hero-asset")).toHaveAttribute("loading", "eager");
  await page.goto("/admin");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("XML editorial pages expose structured source content", async ({ page }) => {
  await page.goto("/skopos");
  await dismissDecorativeIntro(page);
  await expect(page.getByRole("heading", { level: 2, name: /Έρευνα, συνεργασία και εκπαίδευση/ })).toBeVisible();
  await expect(page.locator(".editorial-list li")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Δείτε τα έργα μας" })).toHaveAttribute("href", "/erga");
});

test("reviewed article archive excludes injected records and links to details", async ({ page }) => {
  await page.goto("/arthra");
  await dismissDecorativeIntro(page);
  await expect(page.locator(".archive-card")).toHaveCount(12);
  expect(await page.locator(".article-categories a").count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator(".archive-card-image img").first()).toHaveAttribute("src", /\/images\/wordpress\//);
  await expect(page.getByText(/casino|slots|στοίχημα/i)).toHaveCount(0);
  const firstArticle = page.locator('a[href="/arthra/13o-therino-toyrnoya-golden-cup-generation-next"]');
  await expect(firstArticle).toHaveAttribute("href", "/arthra/13o-therino-toyrnoya-golden-cup-generation-next");
  await firstArticle.click();
  await expect(page).toHaveURL(/13o-therino-toyrnoya-golden-cup-generation-next$/);
  const fullArticleText = (await page.locator(".article-detail-copy").textContent())?.replace(/\s+/g, " ").trim() ?? "";
  expect(fullArticleText.length).toBeGreaterThan(1_000);
  await expect(page.getByText("Ηλικιακές Κατηγορίες", { exact: true })).toBeVisible();
  await expect(page.locator(".article-pullquote")).toBeVisible();
  await expect(page.locator(".related-articles article")).toHaveCount(3);
  const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((value) => JSON.parse(value));
  const articleSchema = schemas.find((value) => value["@type"] === "Article") ?? {};
  expect(articleSchema).toMatchObject({ "@type": "Article", inLanguage: "el-GR" });
  expect(articleSchema.wordCount).toBeGreaterThan(300);
  await page.goto("/arthra?page=5");
  await expect(page.locator(".archive-card")).toHaveCount(10);
});

test("legal pages use structured content without legacy WordPress remnants", async ({ page }) => {
  await page.goto("/oroi-chrisis");
  await dismissDecorativeIntro(page);
  await expect(page.locator(".legal-document li")).toHaveCount(6);
  await expect(page.getByText("[wpforms", { exact: false })).toHaveCount(0);
  await expect(page.getByText("goldencup.gr", { exact: false })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Αίτημα απορρήτου" })).toHaveAttribute("href", "/epikoinonia");
  await page.goto("/cookie-policy");
  await dismissDecorativeIntro(page);
  await expect(page.locator(".legal-document li")).toHaveCount(4);
});

test("contact endpoint validates submissions and silently accepts the honeypot", async ({ request }) => {
  const invalid = await request.post("/api/contact", { data: { name: "A" } });
  expect(invalid.status()).toBe(400);
  const honeypot = await request.post("/api/contact", { data: { name: "Test User", email: "test@example.com", subject: "Test message", message: "This is a valid automated test message.", website: "bot.example" } });
  expect(honeypot.status()).toBe(200);
});

test("health endpoint confirms the configured database without exposing credentials", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ ok: true, database: "connected" });
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("internal links use the page curtain before revealing the next hero", async ({ page }) => {
  await page.goto("/");
  await dismissDecorativeIntro(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.getByRole("link", { name: "Όλα τα άρθρα" }).click();
  const curtain = page.locator("[data-page-curtain]");
  await expect(curtain).toBeVisible();
  await expect(curtain).toHaveCSS("background-color", "rgb(243, 240, 233)");
  await expect(curtain.locator("h2")).toHaveCSS("color", "rgb(23, 23, 21)");
  await expect(page).toHaveURL(/\/arthra$/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Τα άρθρα μας" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
  await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");
  await expect(page.locator(".site-header .brand")).toHaveCSS("opacity", "1");
  await expect(page.locator(".site-header .menu-toggle")).toHaveCSS("opacity", "1");
  await expect(page.locator(".site-stage [data-transition-link]").first()).toHaveCSS("opacity", "1");
});

test("header identity and full-bleed hero parallax retain stable geometry", async ({ page }, testInfo) => {
  await page.goto("/skopos");
  await dismissDecorativeIntro(page);
  const header = page.locator(".site-header");
  const logo = page.locator(".site-header .brand .oaspe-logo-frame");
  const isMobile = testInfo.project.name === "mobile-chromium";
  expect((await header.boundingBox())?.height).toBeGreaterThanOrEqual(isMobile ? 88 : 96);
  expect((await logo.boundingBox())?.width).toBeGreaterThanOrEqual(isMobile ? 132 : 160);
  await expect(page.locator(".page-hero .hero-parallax-background")).toBeVisible();
  await expect(page.locator(".page-hero-asset")).toHaveCSS("object-fit", "cover");
  await expect(page.locator(".page-hero-asset")).toHaveCSS("object-position", "50% 0%");
  const viewport = page.viewportSize();
  const heroHeight = await page.locator(".page-hero").evaluate((element) =>
    Number.parseFloat(window.getComputedStyle(element).height),
  );
  const expectedHeroHeight = (viewport?.height ?? 0) * 0.8;
  expect(heroHeight).toBeGreaterThanOrEqual(expectedHeroHeight - 1);
  expect(heroHeight).toBeLessThanOrEqual(expectedHeroHeight + 1);
});

test("mobile editorial layout stays compact and uses the available width", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile-specific layout contract");
  await page.goto("/");
  await dismissDecorativeIntro(page);
  const headingSize = Number.parseFloat(await page.locator(".home-section-title").first().evaluate((element) => getComputedStyle(element).fontSize));
  expect(headingSize).toBeLessThanOrEqual(33);
  const header = await page.locator(".header-bar").boundingBox();
  const logo = await page.locator(".site-header .oaspe-logo-frame").boundingBox();
  const viewport = page.viewportSize();
  expect(header).not.toBeNull(); expect(logo).not.toBeNull(); expect(viewport).not.toBeNull();
  expect(logo!.x).toBeGreaterThanOrEqual(15);
  expect(header!.x + header!.width - (logo!.x + logo!.width)).toBeGreaterThan(48);
  const serviceList = await page.locator(".service-list").boundingBox();
  const serviceRow = await page.locator(".service-row").first().boundingBox();
  expect(serviceList).not.toBeNull(); expect(serviceRow).not.toBeNull();
  expect(serviceRow!.width).toBeGreaterThanOrEqual(serviceList!.width - 2);
  const workImage = await page.locator(".home-work-image").first().boundingBox();
  expect(workImage!.height).toBeLessThanOrEqual(viewport!.width * 0.74);
  const articleImage = await page.locator(".home-article-image").first().boundingBox();
  expect(articleImage).not.toBeNull();
  expect(articleImage!.height).toBeLessThanOrEqual(viewport!.width * 0.56);
  const h1Size = Number.parseFloat(await page.locator("h1").first().evaluate((element) => getComputedStyle(element).fontSize));
  const h2Size = Number.parseFloat(await page.locator(".home-section-title").first().evaluate((element) => getComputedStyle(element).fontSize));
  const h3Size = Number.parseFloat(await page.locator(".service-row h3").first().evaluate((element) => getComputedStyle(element).fontSize));
  expect(h1Size).toBeLessThanOrEqual(32);
  expect(h2Size).toBeLessThanOrEqual(28);
  expect(h3Size).toBeLessThanOrEqual(21);
  await page.locator(".site-footer").scrollIntoViewIfNeeded();
  const footerNav = await page.locator('.footer-top > nav[aria-label="Πλοήγηση υποσέλιδου"]').boundingBox();
  const footerContact = await page.locator(".footer-contact").boundingBox();
  expect(footerNav).not.toBeNull(); expect(footerContact).not.toBeNull();
  expect(footerNav!.x).toBeLessThan(footerContact!.x);
});

test("reduced motion disables parallax transforms", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".hero-image .parallax-image__media")).toHaveCSS("transform", "none");
});
