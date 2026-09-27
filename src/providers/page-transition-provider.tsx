"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLenis } from "lenis/react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/animations/gsap";
import { PAGE_TRANSITION_TIMING } from "@/lib/animations/timing";

type ContextValue = { isPageReady: boolean; navigateTo: (href: string, label?: string) => void };
const PageTransitionContext = createContext<ContextValue | null>(null);
const routeTitles: Record<string, string> = { "/": "Αρχική", "/sxetika": "Σχετικά", "/skopos": "Σκοπός", "/erga": "Έργα", "/arthra": "Άρθρα", "/dwrees": "Δωρεές", "/epikoinonia": "Επικοινωνία", "/oroi-chrisis": "Όροι χρήσης" };

export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  if (!context) throw new Error("usePageTransition must be used inside PageTransitionProvider.");
  return context;
}

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter(); const pathname = usePathname(); const lenis = useLenis();
  const curtain = useRef<HTMLDivElement>(null); const title = useRef<HTMLHeadingElement>(null);
  const transitioning = useRef(false); const timeline = useRef<gsap.core.Timeline | null>(null); const activeSplit = useRef<SplitText | null>(null);
  const [isPageReady, setIsPageReady] = useState(false);

  useEffect(() => {
    const ready = () => { setIsPageReady(true); document.documentElement.dataset.routeReady = "true"; };
    document.documentElement.dataset.hydrated = "true";
    document.documentElement.dataset.routeReady = "false";
    window.addEventListener("oaspe:loader-complete", ready);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) window.requestAnimationFrame(ready);
    return () => {
      window.removeEventListener("oaspe:loader-complete", ready);
      delete document.documentElement.dataset.hydrated;
    };
  }, []);

  useGSAP(() => {
    const panel = curtain.current; const heading = title.current; if (!panel || !heading) return;
    if (!transitioning.current) { gsap.set(panel, { clipPath: "inset(100% 0 0 0)" }); return; }
    lenis?.scrollTo(0, { immediate: true, force: true }); window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const entranceTargets = gsap.utils.toArray<HTMLElement>(".site-header .brand, .site-header .menu-toggle, .site-stage [data-transition-link]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timeline.current?.kill();
    if (!reduceMotion && entranceTargets.length) gsap.set(entranceTargets, { y: 20, autoAlpha: 0 });
    timeline.current = gsap.timeline({ onComplete: () => {
      transitioning.current = false; activeSplit.current?.revert(); activeSplit.current = null;
      if (entranceTargets.length) gsap.set(entranceTargets, { clearProps: "transform,opacity,visibility" });
      setIsPageReady(true); document.documentElement.dataset.routeReady = "true"; lenis?.resize(); lenis?.start();
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }}).to(panel, { clipPath: "inset(0 0 100% 0)", duration: PAGE_TRANSITION_TIMING.reveal, ease: "power3.inOut" });
    if (!reduceMotion && entranceTargets.length) timeline.current.to(entranceTargets, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.018, ease: "power3.out" }, 0.08);
    timeline.current
      .set(heading, { autoAlpha: 0 }).set(panel, { clipPath: "inset(100% 0 0 0)" });
    return () => {
      timeline.current?.kill();
      if (entranceTargets.length) gsap.set(entranceTargets, { clearProps: "transform,opacity,visibility" });
    };
  }, { scope: curtain, dependencies: [pathname] });

  const navigateTo = useCallback((href: string, label?: string) => {
    if (transitioning.current) return;
    const destination = new URL(href, window.location.href);
    if (destination.pathname === window.location.pathname) return;
    const panel = curtain.current; const heading = title.current;
    if (!panel || !heading) { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); router.push(href); return; }
    transitioning.current = true; setIsPageReady(false); document.documentElement.dataset.routeReady = "false"; lenis?.stop();
    heading.textContent = routeTitles[destination.pathname] ?? label?.trim() ?? decodeURIComponent(destination.pathname.split("/").filter(Boolean).at(-1) ?? "ΟΑΣΠΕ");
    activeSplit.current?.revert(); activeSplit.current = SplitText.create(heading, { type: "chars", mask: "chars" });
    const chars = activeSplit.current.chars;
    gsap.set(panel, { clipPath: "inset(100% 0 0 0)", autoAlpha: 1 }); gsap.set(heading, { autoAlpha: 1 }); gsap.set(chars, { yPercent: 120, rotate: 2 });
    timeline.current = gsap.timeline()
      .to(panel, { clipPath: "inset(0 0 0 0)", duration: PAGE_TRANSITION_TIMING.cover, ease: "power3.inOut" }, 0)
      .to(chars, { yPercent: 0, rotate: 0, duration: PAGE_TRANSITION_TIMING.titleIn, stagger: .01, ease: "power3.out" }, PAGE_TRANSITION_TIMING.titleInAt)
      .to(chars, { yPercent: -120, rotate: -2, duration: PAGE_TRANSITION_TIMING.titleOut, stagger: .006, ease: "power3.in" }, PAGE_TRANSITION_TIMING.titleOutAt)
      .call(() => { ScrollTrigger.getAll().forEach((trigger) => trigger.kill()); lenis?.scrollTo(0, { immediate: true, force: true }); window.scrollTo({ top: 0, left: 0, behavior: "instant" }); router.push(href, { scroll: false }); }, [], PAGE_TRANSITION_TIMING.routeSwap);
  }, [lenis, router]);

  return <PageTransitionContext.Provider value={{ isPageReady, navigateTo }}>{children}<div ref={curtain} className="page-curtain" data-page-curtain aria-hidden="true"><h2 ref={title} /></div></PageTransitionContext.Provider>;
}
