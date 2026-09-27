import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { TransitionLink } from "@/components/ui/transition-link";
import { articleCategories, articles } from "@/data/articles";
import { articleImageSrc } from "@/lib/media/article-image";
import { publicMetadata } from "@/lib/seo";

const pageSize = 12;
type Search = Promise<{ page?: string; category?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const { page, category } = await searchParams;
  const pageNumber = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const suffix = [category, pageNumber > 1 ? `Σελίδα ${pageNumber}` : ""].filter(Boolean).join(" · ");
  return publicMetadata({
    title: suffix ? `Άρθρα · ${suffix}` : "Άρθρα για ακαδημίες ποδοσφαίρου",
    description: "Άρθρα του ΟΑΣΠΕ για ακαδημίες ποδοσφαίρου, παιδιά, γονείς, προπονητές, αθλητική εκπαίδευση και ιστορικές διοργανώσεις.",
    path: "/arthra",
    image: "/images/wordpress/2024/10/we_like_you_too_oaspe.jpg",
  });
}

function archiveHref(page: number, category?: string) {
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (page > 1) query.set("page", String(page));
  const value = query.toString();
  return value ? `/arthra?${value}` : "/arthra";
}

export default async function ArticlesPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  const selectedCategory = query.category && articleCategories.includes(query.category) ? query.category : undefined;
  const filtered = selectedCategory ? articles.filter((article) => article.categories.includes(selectedCategory)) : articles;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const currentPage = Math.min(requestedPage, pageCount);
  const visibleArticles = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return <main>
    <PageHero title="Τα άρθρα μας" eyebrow="Γνώση & ενημέρωση" intro="Γνώση, εμπειρίες και ιστορίες για την ανάπτυξη των ακαδημιών ποδοσφαίρου, με το παιδί και την αθλητική παιδεία στο επίκεντρο." image="/images/wordpress/2024/10/we_like_you_too_oaspe.jpg" priority />
    <section className="articles-archive section-pad" aria-labelledby="articles-archive-title">
      <div className="articles-archive-heading"><p className="eyebrow">58 κείμενα από το αρχείο</p><h2 id="articles-archive-title">Πρακτική γνώση και ιστορίες από το αναπτυξιακό ποδόσφαιρο.</h2><p className="articles-archive-intro">Το αρχείο του ΟΑΣΠΕ συγκεντρώνει θέματα οργάνωσης ακαδημιών, συμβουλές για γονείς και προπονητές, επιστημονικές απόψεις και στιγμές από διοργανώσεις που έφεραν παιδιά και συλλόγους κοντά.</p></div>
      <nav className="article-categories" aria-label="Θεματικές άρθρων"><span>Θεματικές</span><Link aria-current={!selectedCategory ? "page" : undefined} href="/arthra">Όλα</Link>{articleCategories.map((category) => <Link aria-current={selectedCategory === category ? "page" : undefined} key={category} href={archiveHref(1, category)}>{category}</Link>)}</nav>
      <div className="articles-archive-grid">{visibleArticles.map((article, index) => <article className="archive-card" key={article.slug}>
        <TransitionLink href={`/arthra/${article.slug}`} aria-label={`Διαβάστε: ${article.title}`}>
          <ParallaxImage className="archive-card-image" src={articleImageSrc(article.image)} alt={article.title} sizes="(max-width: 720px) 100vw, 33vw" />
          <div className="archive-card-meta"><span>{String((currentPage - 1) * pageSize + index + 1).padStart(2, "0")}</span><span>{article.category}</span><time dateTime={article.publishedAt}>{article.date}</time></div>
          <h3>{article.title}</h3><p>{article.summary}</p><b>Διαβάστε το άρθρο <ArrowUpRight /></b>
        </TransitionLink>
      </article>)}</div>
      <nav className="archive-pagination" aria-label="Σελιδοποίηση άρθρων">
        {currentPage > 1 ? <Link href={archiveHref(currentPage - 1, selectedCategory)}><ArrowLeft /> Προηγούμενη</Link> : <span />}
        <span>Σελίδα {currentPage} / {pageCount}</span>
        {currentPage < pageCount ? <Link href={archiveHref(currentPage + 1, selectedCategory)}>Επόμενη <ArrowRight /></Link> : <span />}
      </nav>
    </section>
  </main>;
}
