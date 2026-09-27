import { ArrowUpRight } from "lucide-react";
import { AnimatedTitle } from "@/components/motion/animated-title";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { TransitionLink } from "@/components/ui/transition-link";
import { HoverText } from "@/components/ui/hover-text";

const articles = [
  { slug: "lorem-ipsum", title: "Οργάνωση και λειτουργία Ακαδημίας Ποδοσφαίρου", category: "Ακαδημίες", image: "/images/wordpress/2016/03/Acadimies_big-1.jpg" },
  { slug: "pos-epilegoyme-akadimia-podosfairoy", title: "Πώς επιλέγουμε ακαδημία ποδοσφαίρου;", category: "Γονείς", image: "/images/wordpress/2016/02/goneis_paidia_17.jpg" },
  { slug: "i-synaisthimatiki-noimosyni-sta-paidi", title: "Η συναισθηματική νοημοσύνη στα παιδιά", category: "Παιδί", image: "/images/wordpress/2016/05/soccer_kids.jpg" },
] as const;

export function HomeArticlesSection() {
  return <section className="home-articles section-pad" aria-labelledby="home-articles-title"><div className="section-heading-row"><div><p className="eyebrow">04 / Από το αρχείο μας</p><AnimatedTitle id="home-articles-title" as="h2" className="home-section-title">Γνώση για όσους είναι δίπλα στα παιδιά.</AnimatedTitle></div><TransitionLink className="text-link" href="/arthra"><HoverText>Όλα τα άρθρα</HoverText> <ArrowUpRight /></TransitionLink></div><div className="home-article-grid">{articles.map((article) => <article key={article.title} className="home-article"><ParallaxImage className="home-article-image" src={article.image} alt="" sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw" /><div className="home-article-card-body"><p>{article.category}</p><h3>{article.title}</h3><TransitionLink href={`/arthra/${article.slug}`} aria-label={`Διαβάστε: ${article.title}`}><HoverText>Διαβάστε το άρθρο</HoverText> <ArrowUpRight /></TransitionLink></div></article>)}</div></section>;
}
