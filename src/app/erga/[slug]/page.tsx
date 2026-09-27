import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { TransitionLink } from "@/components/ui/transition-link";
import { getAdminProject } from "@/lib/admin-projects";
import { publicMetadata } from "@/lib/seo";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const item = await getAdminProject((await params).slug); return item ? publicMetadata({ title: item.title, description: item.summary, path: `/erga/${item.slug}`, image: item.image }) : {}; }
export default async function PortfolioDetailPage({ params }: { params: Promise<{ slug: string }> }) { const item = await getAdminProject((await params).slug); if (!item) notFound(); return <main><PageHero title={item.title} eyebrow={`${item.year} / Έργο ΟΑΣΠΕ`} intro={item.summary} image={item.image} /><section className="portfolio-detail section-pad"><div><p className="eyebrow">Από το αρχείο του ΟΑΣΠΕ</p><h2>{item.summary}</h2></div><ParallaxImage className="portfolio-detail-image" src={item.image} alt={item.title} sizes="(max-width: 900px) 100vw, 55vw" /><div className="portfolio-detail-list"><ol>{item.details.map((detail, index) => <li key={detail}><span>{String(index + 1).padStart(2, "0")}</span><p>{detail}</p></li>)}</ol><TransitionLink href="/erga">← Όλα τα έργα</TransitionLink></div></section></main>; }
