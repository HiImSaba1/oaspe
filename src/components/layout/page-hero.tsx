"use client";

import { AnimatedTitle } from "@/components/motion/animated-title";
import { ParallaxImage } from "@/components/motion/parallax-image";

export function PageHero({
  title,
  eyebrow,
  intro,
  image,
  priority = false,
}: {
  title: string;
  eyebrow: string;
  intro: string;
  image: string;
  priority?: boolean;
}) {
  return (
    <section className="page-hero route-hero-enter" aria-label={title}>
      <ParallaxImage
        src={image}
        alt=""
        priority={priority}
        loading={priority ? "eager" : undefined}
        speed={24}
        sizes="70vw"
        className="page-hero-media hero-parallax-background"
        imageClassName="page-hero-asset"
      />
      <div className="page-hero-shade" />
      <div className="page-hero-inner">
        <div className="page-hero-meta">
          <span>{eyebrow}</span>
          <span>ΟΑΣΠΕ · Ελλάδα</span>
        </div>
        <div>
          <AnimatedTitle as="h1" className="page-hero-title" type="words">
            {title}
          </AnimatedTitle>
          <div className="page-hero-bottom">
            <p>{intro}</p>
            <span>Κύλιση ↓</span>
          </div>
        </div>
      </div>
    </section>
  );
}
