import { ArrowUpRight } from "lucide-react";
import { AnimatedTitle } from "@/components/motion/animated-title";
import { TransitionLink } from "@/components/ui/transition-link";
import { HoverText } from "@/components/ui/hover-text";
import type { LegalPageData } from "@/data/legal-pages";

export function LegalPageContent({ data }: { data: LegalPageData }) {
  return <section className="legal-content section-pad" aria-labelledby="legal-content-title">
    <aside className="legal-sidebar">
      <p className="eyebrow">01 / {data.label}</p>
      <p>{data.reviewNote}</p>
      <TransitionLink href="/epikoinonia"><HoverText>Αίτημα απορρήτου</HoverText> <ArrowUpRight /></TransitionLink>
    </aside>
    <div className="legal-document">
      <AnimatedTitle id="legal-content-title" as="h2">Με σαφήνεια και σεβασμό στον επισκέπτη.</AnimatedTitle>
      <p className="legal-lead">{data.introduction}</p>
      <ol>{data.sections.map((section, index) => <li key={section.title}>
        <div><span>{String(index + 1).padStart(2, "0")}</span><h3>{section.title}</h3></div>
        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </li>)}</ol>
    </div>
  </section>;
}
