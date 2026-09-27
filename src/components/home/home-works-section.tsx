import { ArrowUpRight } from "lucide-react";
import { AnimatedTitle } from "@/components/motion/animated-title";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { TransitionLink } from "@/components/ui/transition-link";
import { HoverText } from "@/components/ui/hover-text";
import { listAdminProjects } from "@/lib/admin-projects";

export async function HomeWorksSection({ title = "Πρωτοβουλίες με διάρκεια και ουσιαστικό αποτύπωμα." }: { title?: string }) {
  const featuredWorks = (await listAdminProjects()).slice(0, 3);
  return (
    <section className="home-works section-pad" aria-labelledby="home-works-title">
      <div className="home-works-heading">
        <div>
          <p className="eyebrow">03 / Επιλεγμένα έργα</p>
          <AnimatedTitle id="home-works-title" as="h2" className="home-section-title">
            {title}
          </AnimatedTitle>
        </div>
        <TransitionLink className="text-link" href="/erga">
          <HoverText>Όλα τα έργα</HoverText> <ArrowUpRight />
        </TransitionLink>
      </div>

      <div className="home-works-grid">
        {featuredWorks.map((work, index) => (
          <article className="home-work" key={work.slug}>
            <TransitionLink href={`/erga/${work.slug}`} aria-label={`Προβολή έργου: ${work.title}`}>
              <ParallaxImage
                className="home-work-image"
                src={work.image}
                alt={work.title}
                sizes="(max-width: 760px) 100vw, 33vw"
              />
              <div className="home-work-meta">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{work.year}</span>
              </div>
              <h3>{work.title}</h3>
              <p>{work.summary}</p>
              <span className="home-work-link"><HoverText>Προβολή έργου</HoverText> <ArrowUpRight /></span>
            </TransitionLink>
          </article>
        ))}
      </div>
    </section>
  );
}
