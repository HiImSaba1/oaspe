"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText } from "@/lib/animations/gsap";

const loaderImages = [
  "/images/wordpress/2016/02/Acadimies_big-7.jpg",
  "/images/wordpress/2016/02/goneis_paidia_17.jpg",
  "/images/wordpress/2016/03/Acadimies_big-1.jpg",
  "/images/wordpress/2016/02/skopos_17.jpg",
  "/images/wordpress/2016/02/oaspe_kid.jpg",
  "/images/wordpress/2016/05/soccer_kids.jpg",
];
const rotations = [8, -3, -10, 10, -7, 5];

export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const finish = () => {
      document.documentElement.style.overflow = "";
      document.documentElement.dataset.routeReady = "true";
      window.dispatchEvent(new CustomEvent("oaspe:loader-complete"));
      setVisible(false);
    };
    if (navigator.webdriver) {
      const frame = window.requestAnimationFrame(finish);
      return () => window.cancelAnimationFrame(frame);
    }
    const safetyTimer = window.setTimeout(finish, 7000);
    return () => window.clearTimeout(safetyTimer);
  }, []);

  useGSAP(() => {
    if (!root.current || !counter.current) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cards = gsap.utils.toArray<HTMLElement>("[data-loader-card]");
    const titleElement = root.current.querySelector<HTMLElement>("[data-loader-title]");
    if (!titleElement) return;
    const title = SplitText.create(titleElement, { type: "chars", mask: "chars" });
    const progress = { value: 0 };
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    gsap.set(cards, { xPercent: -50, yPercent: -50, scale: 0, rotation: (index) => rotations[index], clipPath: "inset(20% 20% 20% 20%)" });
    gsap.set(title.chars, { yPercent: 110, rotation: 8, transformOrigin: "0% 100%" });
    gsap.set(counter.current, { yPercent: 110 });

    if (reduceMotion) {
      gsap.set(root.current, { display: "none" });
      document.documentElement.style.overflow = previousOverflow;
      document.documentElement.dataset.routeReady = "true";
      window.dispatchEvent(new CustomEvent("oaspe:loader-complete"));
      setVisible(false);
      title.revert();
      return;
    }

    const timeline = gsap.timeline({ delay: 0.15, onComplete: () => {
      document.documentElement.style.overflow = previousOverflow;
      document.documentElement.dataset.routeReady = "true";
      window.dispatchEvent(new CustomEvent("oaspe:loader-complete"));
      setVisible(false);
    } });
    timeline
      .to(cards, { scale: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.65, ease: "power3.inOut", stagger: 0.09 })
      .set("[data-loader-brand]", { autoAlpha: 1 }, 0.3)
      .to(title.chars, { yPercent: 0, rotation: 0, duration: 0.7, ease: "power3.out", stagger: 0.025 }, 0.22)
      .to(counter.current, { yPercent: 0, duration: 0.6, ease: "power3.out" }, 0.22)
      .to(progress, { value: 100, duration: 1.25, ease: "power2.inOut", onUpdate: () => { if (counter.current) counter.current.textContent = String(Math.round(progress.value)).padStart(3, "0"); } }, 0.58)
      .to(title.chars, { yPercent: -110, rotation: -8, duration: 0.48, ease: "power3.in", stagger: 0.018 }, 2.05)
      .to(counter.current, { yPercent: -110, duration: 0.48, ease: "power3.in" }, 2.05)
      .to(cards, { scale: 0, clipPath: "inset(20% 20% 20% 20%)", duration: 0.58, ease: "power3.inOut", stagger: -0.04 }, 2.18)
      .to(root.current, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.72, ease: "power4.inOut" }, 2.75);
    return () => { timeline.kill(); title.revert(); document.documentElement.style.overflow = previousOverflow; };
  }, { scope: root });

  if (!visible) return null;
  return <div ref={root} data-preloader className="preloader" aria-hidden="true">
    {loaderImages.map((src, index) => <div key={src} data-loader-card className="preloader-card"><Image src={src} alt="" fill unoptimized sizes="250px" priority={index < 3} /></div>)}
    <div data-loader-brand className="preloader-brand"><div data-loader-title className="preloader-title"><span>ΟΡΓΑΝΙΣΜΟΣ</span><br /><span>ΑΝΑΠΤΥΞΗΣ ΣΧΟΛΩΝ</span><br /><span>ΠΟΔΟΣΦΑΙΡΟΥ ΕΛΛΑΔΟΣ</span></div></div>
    <div className="preloader-count"><span ref={counter}>000</span></div>
  </div>;
}
