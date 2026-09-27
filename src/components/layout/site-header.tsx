"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { TransitionLink } from "@/components/ui/transition-link";
import { LetterHoverLink } from "@/components/ui/letter-hover-link";
import { OaspeLogo } from "@/components/layout/oaspe-logo";

const navigation = [["Σχετικά", "/sxetika"], ["Σκοπός", "/skopos"], ["Έργα", "/erga"], ["Άρθρα", "/arthra"], ["Δωρεές", "/dwrees"], ["Επικοινωνία", "/epikoinonia"]] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [glass, setGlass] = useState(false);
  const pathname = usePathname();
  const root = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setGlass(window.scrollY > 70);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    window.requestAnimationFrame(() => panel.current?.querySelector<HTMLAnchorElement>("a")?.focus());
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useGSAP(() => {
    if (!panel.current) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) { gsap.set(panel.current, { clipPath: open ? "inset(0 0 0 0)" : "inset(0 0 100% 0)" }); return; }
    const timeline = gsap.timeline();
    if (open) {
      timeline.to(panel.current, { clipPath: "inset(0 0 0% 0)", duration: 1, ease: "power4.inOut" })
        .fromTo("[data-menu-link]", { yPercent: 115, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: .065, duration: .72, ease: "power4.out" }, .4)
        .fromTo("[data-menu-meta]", { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: .06, duration: .55 }, .55);
    } else {
      timeline.to("[data-menu-link]", { yPercent: -110, opacity: 0, stagger: { each: .03, from: "end" }, duration: .35, ease: "power3.in" })
        .to(panel.current, { clipPath: "inset(0 0 100% 0)", duration: .75, ease: "power4.inOut" }, .08);
    }
  }, { scope: root, dependencies: [open] });

  return (
    <header ref={root} className={cn("site-header", glass && "site-header--glass", open && "site-header--open")}>
      <div className="header-bar">
        <TransitionLink className="brand" href="/" aria-label="ΟΑΣΠΕ — Αρχική" onClick={() => setOpen(false)}><OaspeLogo variant="dark" priority /></TransitionLink>
        <button ref={toggle} className={cn("menu-toggle", open && "menu-toggle--open")} type="button" aria-expanded={open} aria-controls="site-menu" aria-label={open ? "Κλείσιμο μενού" : "Άνοιγμα μενού"} onClick={() => setOpen((value) => !value)}>
          <span className="menu-label">{open ? "Κλείσιμο" : "Μενού"}</span><span className="menu-icon"><i /><i /></span>
        </button>
      </div>
      <div ref={panel} id="site-menu" className="menu-panel" aria-hidden={!open} inert={!open}>
        <nav aria-label="Κύρια πλοήγηση">
          {navigation.map(([label, href]) => <div className="menu-link-clip" key={href}><LetterHoverLink data-menu-link href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}</LetterHoverLink></div>)}
        </nav>
        <div className="menu-aside" data-menu-meta><p>ΟΑΣΠΕ</p><span>Με το παιδί στο κέντρο.</span><TransitionLink href="mailto:info@oaspe.org">info@oaspe.org</TransitionLink></div>
      </div>
    </header>
  );
}
