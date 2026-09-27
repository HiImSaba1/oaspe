import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { TransitionLink } from "@/components/ui/transition-link";
import { listAdminProjects } from "@/lib/admin-projects";
import { publicMetadata } from "@/lib/seo";
export const metadata: Metadata = publicMetadata({ title: "Έργα", description: "Δράσεις και έργα του ΟΑΣΠΕ από το αρχείο του οργανισμού.", path: "/erga", image: "/images/wordpress/2018/11/DSC_2751.jpg" });
export default async function PortfolioPage() { const items = await listAdminProjects(); const heroImage = items[1]?.image ?? items[0]?.image ?? "/images/wordpress/2018/11/DSC_2751.jpg"; return <main><PageHero title="Έργα που έγιναν σημεία αναφοράς." eyebrow="Αρχείο δράσεων" intro="Πρωτοβουλίες του ΟΑΣΠΕ με επίκεντρο τις ακαδημίες, την εκπαίδευση και τη συμπερίληψη." image={heroImage} /><section className="portfolio-grid section-pad" aria-label="Έργα ΟΑΣΠΕ">{items.map((item) => <article className="portfolio-card" key={item.slug}><TransitionLink href={`/erga/${item.slug}`}><ParallaxImage className="portfolio-card-image" src={item.image} alt={item.title} sizes="(max-width: 700px) 100vw, 50vw" /><div><span>{item.year}</span><h2>{item.title}</h2><p>{item.summary}</p><b>Προβολή έργου <ArrowUpRight /></b></div></TransitionLink></article>)}</section></main>; }
