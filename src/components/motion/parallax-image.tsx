"use client";

import Image, { type ImageProps } from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";
import { cn } from "@/lib/utils";

type ParallaxImageProps = Omit<ImageProps, "fill"> & {
  className?: string;
  imageClassName?: string;
  speed?: number;
};

export function ParallaxImage({ className, imageClassName, speed = 12, sizes = "(max-width: 768px) 100vw, 50vw", alt, ...props }: ParallaxImageProps) {
  const root = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!root.current || !media.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(media.current, { yPercent: -speed }, {
      yPercent: speed,
      ease: "none",
      scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.7 },
    });
  }, { scope: root, dependencies: [speed], revertOnUpdate: true });

  return (
    <div ref={root} className={cn("parallax-image", className)}>
      <div ref={media} className="parallax-image__media">
        <Image fill unoptimized sizes={sizes} alt={alt} className={cn("parallax-image__asset", imageClassName)} {...props} />
      </div>
    </div>
  );
}
