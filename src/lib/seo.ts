import type { Metadata } from "next";

export const siteName = "ΟΑΣΠΕ";
export const siteDescription = "Οργανισμός Ανάπτυξης Σχολών Ποδοσφαίρου Ελλάδας.";
export const siteKeywords = ["ΟΑΣΠΕ", "ακαδημίες ποδοσφαίρου", "σχολές ποδοσφαίρου", "αναπτυξιακό ποδόσφαιρο", "παιδικό ποδόσφαιρο", "αθλητισμός", "Ελλάδα"];

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  try {
    return new URL(configured || "https://oaspe.org");
  } catch {
    return new URL("https://oaspe.org");
  }
}

export function publicMetadata({
  title,
  description = siteDescription,
  path,
  image = "/images/wordpress/2024/12/oaspe_header_main_page_14.png",
  kind = "website",
  publishedTime,
  section,
  author = siteName,
}: {
  title?: string;
  description?: string;
  path: string;
  image?: string;
  kind?: "website" | "article";
  publishedTime?: string;
  section?: string;
  author?: string;
}): Metadata {
  const canonical = path === "/" ? "/" : path.replace(/\/$/, "");
  const socialImage = { url: image, alt: `${title ?? siteName} — ${siteName}` };
  const openGraph = kind === "article" ? {
    type: "article" as const, locale: "el_GR", siteName, title: title ?? siteName, description, url: canonical,
    images: [socialImage], publishedTime, authors: [author], section,
  } : {
    type: "website" as const, locale: "el_GR", siteName, title: title ?? siteName, description, url: canonical,
    images: [socialImage],
  };
  return {
    title,
    description,
    keywords: siteKeywords,
    alternates: { canonical },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: title ?? siteName,
      description,
      images: [image],
    },
  };
}
