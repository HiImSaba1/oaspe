"use client";

import { useRef, type ElementType } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText } from "@/lib/animations/gsap";
import { cn } from "@/lib/utils";
import { usePageTransition } from "@/providers/page-transition-provider";

type AnimatedTitleProps = {
  as?: ElementType;
  children: string;
  className?: string;
  id?: string;
  type?: "words" | "lines";
  delay?: number;
};

export function AnimatedTitle({ as: Tag = "h2", children, className, id, type = "words", delay = 0 }: AnimatedTitleProps) {
  const root = useRef<HTMLElement>(null);
  const { isPageReady } = usePageTransition();

  useGSAP(() => {
    const element = root.current;
    if (!element) return;
    if (!isPageReady) { gsap.set(element, { autoAlpha: 0 }); return; }
    let split: SplitText | undefined;
    let animation: gsap.core.Tween | undefined;
    let cancelled = false;

    const setup = () => {
      if (cancelled || !element.isConnected) return;
      gsap.set(element, { autoAlpha: 1 });
      split = SplitText.create(element, { type, mask: type, autoSplit: type === "lines" });
      const targets = split[type];
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(element, { autoAlpha: 1 });
        return;
      }
      gsap.set(targets, { yPercent: 110, rotate: 0.001, willChange: "transform" });
      animation = gsap.to(targets, {
        yPercent: 0,
        delay,
        duration: 1,
        stagger: type === "words" ? 0.055 : 0.12,
        ease: "expo.out",
        clearProps: "transform,willChange",
        scrollTrigger: { trigger: element, start: "top 88%", once: true },
      });
    };

    if (document.fonts.status === "loaded") setup();
    else void document.fonts.ready.then(setup);

    return () => { cancelled = true; animation?.kill(); split?.revert(); };
  }, { scope: root, dependencies: [children, delay, type, isPageReady], revertOnUpdate: true });

  return <Tag ref={root} id={id} className={cn("animated-title", className)}>{children}</Tag>;
}
