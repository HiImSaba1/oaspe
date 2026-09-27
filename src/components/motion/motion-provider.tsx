"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import { ScrollTrigger } from "@/lib/animations/gsap";
import { PageTransitionProvider } from "@/providers/page-transition-provider";
import { Preloader } from "@/components/motion/preloader";
import { Toaster } from "sonner";

export function MotionProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    return () => window.removeEventListener("load", refresh);
  }, []);
  return <ReactLenis ref={lenisRef} root options={{ duration: 1.15, easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)), smoothWheel: true }}><PageTransitionProvider><Preloader />{children}<Toaster richColors position="bottom-right" /></PageTransitionProvider></ReactLenis>;
}
