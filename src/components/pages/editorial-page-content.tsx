import { ArrowUpRight } from "lucide-react";
import { AnimatedTitle } from "@/components/motion/animated-title";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { TransitionLink } from "@/components/ui/transition-link";
import { HoverText } from "@/components/ui/hover-text";

export type EditorialPageData = {
  label: string;
  statement: string;
  body: readonly string[];
  images: readonly { src: string; alt: string }[];
  listTitle: string;
  items: readonly string[];
  cta?: { label: string; href: string };
};

export function EditorialPageContent({ data }: { data: EditorialPageData }) {
  return (
    <div className="editorial-page">
      <section className="editorial-intro section-pad">
        <p className="eyebrow">01 / {data.label}</p>
        <AnimatedTitle as="h2" className="editorial-statement">{data.statement}</AnimatedTitle>
        <div className="editorial-copy">
          {data.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </section>

      <section className={`editorial-gallery section-pad editorial-gallery--${Math.min(data.images.length, 3)}`} aria-label={`${data.label} — εικόνες`}>
        {data.images.map((image, index) => (
          <ParallaxImage
            key={image.src}
            className={`editorial-gallery-image editorial-gallery-image--${index + 1}`}
            src={image.src}
            alt={image.alt}
            sizes="(max-width: 700px) 100vw, 50vw"
          />
        ))}
      </section>

      <section className="editorial-list section-pad">
        <div>
          <p className="eyebrow">02 / Αρχές και δράσεις</p>
          <AnimatedTitle as="h2" className="editorial-list-title">{data.listTitle}</AnimatedTitle>
        </div>
        <ol>
          {data.items.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </li>
          ))}
        </ol>
      </section>

      {data.cta ? (
        <section className="editorial-cta section-pad">
          <p>Θέλετε να μάθετε περισσότερα ή να στηρίξετε μια δράση;</p>
          <TransitionLink href={data.cta.href}><HoverText>{data.cta.label}</HoverText><ArrowUpRight /></TransitionLink>
        </section>
      ) : null}
    </div>
  );
}
