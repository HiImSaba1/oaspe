"use client";

import { useRef } from "react";
import { useMenuLetterHoverAnimation } from "@/hooks/use-menu-letter-hover-animation";

export function HoverText({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useMenuLetterHoverAnimation(ref, children);
  return <span ref={ref} className="letter-hover-link"><span className="letter-hover-stack"><span data-hover-text-base>{children}</span><span data-hover-text-active aria-hidden="true">{children}</span></span></span>;
}
