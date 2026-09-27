"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";

export function Magnetic({ children, strength = 0.22 }: { children: ReactNode; strength?: number }) {
  const root = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const element = root.current;
    if (!element) return;
    const media = gsap.matchMedia();
    media.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const move = (event: PointerEvent) => {
        const bounds = element.getBoundingClientRect();
        gsap.to(element, { x: (event.clientX - bounds.left - bounds.width / 2) * strength, y: (event.clientY - bounds.top - bounds.height / 2) * strength, duration: 0.45, ease: "power3.out", overwrite: "auto" });
      };
      const leave = () => gsap.to(element, { x: 0, y: 0, duration: 0.75, ease: "elastic.out(1, 0.38)" });
      element.addEventListener("pointermove", move);
      element.addEventListener("pointerleave", leave);
      return () => { element.removeEventListener("pointermove", move); element.removeEventListener("pointerleave", leave); };
    });
    return () => media.revert();
  }, { scope: root });
  return <span ref={root} className="magnetic-root">{children}</span>;
}
