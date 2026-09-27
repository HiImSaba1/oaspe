import type { Metadata } from "next";
import { MotionProvider } from "@/components/motion/motion-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getSiteUrl, publicMetadata, siteDescription, siteName } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  ...publicMetadata({ path: "/" }),
  metadataBase: getSiteUrl(),
  title: { default: siteName, template: `%s — ${siteName}` },
  applicationName: siteName,
  category: "sports",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const organizationJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    alternateName: "Οργανισμός Ανάπτυξης Σχολών Ποδοσφαίρου Ελλάδας",
    url: getSiteUrl().toString(),
    logo: new URL("/icon.png", getSiteUrl()).toString(),
    description: siteDescription,
  }).replaceAll("<", "\\u003c");
  return (
    <html lang="el" className="antialiased"><body suppressHydrationWarning><MotionProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: organizationJsonLd }} />
      <a className="skip-link" href="#main-content">Μετάβαση στο κύριο περιεχόμενο</a>
      <SiteHeader />
      <div className="site-stage" id="main-content" tabIndex={-1}>{children}</div>
      <SiteFooter />
    </MotionProvider></body></html>
  );
}
