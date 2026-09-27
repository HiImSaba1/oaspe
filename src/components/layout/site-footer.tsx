"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "@/lib/animations/gsap";
import { TransitionLink } from "@/components/ui/transition-link";
import { HoverText } from "@/components/ui/hover-text";

const navigation = [["Σχετικά", "/sxetika"], ["Σκοπός", "/skopos"], ["Έργα", "/erga"], ["Άρθρα", "/arthra"], ["Δωρεές", "/dwrees"], ["Επικοινωνία", "/epikoinonia"]] as const;

export function SiteFooter() {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    const footer = root.current; if (!footer) return;
    const items = footer.querySelectorAll<HTMLElement>("[data-footer-item]");
    const media = gsap.matchMedia();
    media.add("(min-width: 768px) and (hover: hover) and (prefers-reduced-motion: no-preference)", () => {
      gsap.set(footer, { clipPath: "inset(100% 0 0 0)" }); gsap.set(items, { y: 28, autoAlpha: 0 });
      const timeline = gsap.timeline({ scrollTrigger: { trigger: footer, start: "bottom bottom", once: true } })
        .to(footer, { clipPath: "inset(0 0 0 0)", duration: .95, ease: "power4.inOut" })
        .to(items, { y: 0, autoAlpha: 1, duration: .6, stagger: .055, ease: "power3.out" }, "-=.35");
      return () => timeline.kill();
    });
    return () => media.revert();
  }, { scope: root });

  return <footer ref={root} className="site-footer">
    <div className="footer-top">
      <div><p data-footer-item className="section-index">Με το παιδί στο κέντρο</p><p data-footer-item className="footer-intro">Για έναν αθλητισμό που εκπαιδεύει, ενώνει και προστατεύει.</p></div>
      <nav aria-label="Πλοήγηση υποσέλιδου">{navigation.map(([label, href]) => <span data-footer-item key={href}><TransitionLink href={href}>{label}</TransitionLink></span>)}</nav>
      <div className="footer-contact" data-footer-item><TransitionLink href="mailto:info@oaspe.org">info@oaspe.org</TransitionLink><p>Ελλάδα<br />Δράση για όλη την κοινωνία</p><nav className="footer-legal" aria-label="Νομικές πληροφορίες"><TransitionLink href="/oroi-chrisis">Προσωπικά δεδομένα</TransitionLink><TransitionLink href="/cookie-policy">Cookies</TransitionLink></nav><TransitionLink href="/epikoinonia"><HoverText>Μιλήστε μαζί μας</HoverText> <ArrowUpRight /></TransitionLink></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} ΟΑΣΠΕ</span><TransitionLink className="footer-credit" href="https://sabaweb.gr" target="_blank" rel="noreferrer">Made by Saba Web Solutions</TransitionLink></div>
  </footer>;
}
