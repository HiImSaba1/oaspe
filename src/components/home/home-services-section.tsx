"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";
import { TransitionLink } from "@/components/ui/transition-link";

const services = [
  { index: "01", title: "Οργάνωση ακαδημιών", summary: "Έρευνα, οργάνωση και ανάπτυξη σχολών και ακαδημιών ποδοσφαίρου με λύσεις προσαρμοσμένες στις ανάγκες κάθε συλλόγου.", tags: ["Έρευνα", "Διοίκηση", "Ανάπτυξη"], image: "/images/wordpress/2016/03/Acadimies_big-1.jpg" },
  { index: "02", title: "Εκπαίδευση & δράσεις", summary: "Εκπαιδευτικά προγράμματα, εκδηλώσεις, σεμινάρια και τουρνουά που ενισχύουν τη γνώση και τη συνεργασία.", tags: ["Σεμινάρια", "Εκδηλώσεις", "Τουρνουά"], image: "/images/wordpress/2016/05/soccer_kids.jpg" },
  { index: "03", title: "Δίκτυο συνεργασιών", summary: "Σύνδεση σχολών, επιστημόνων και αθλητικών φορέων στην Ελλάδα και στο εξωτερικό για κοινές πρωτοβουλίες.", tags: ["Συνεργασίες", "Επιστήμες", "Δίκτυο"], image: "/images/wordpress/2024/10/business-handshake.png" },
  { index: "04", title: "Ενημέρωση & προβολή", summary: "Αξιόπιστη ενημέρωση, διατήρηση βάσης δεδομένων και προβολή των δράσεων που εξελίσσουν το αναπτυξιακό ποδόσφαιρο.", tags: ["Άρθρα", "Προβολή", "Αξιολόγηση"], image: "/images/wordpress/2024/10/oaspe_QUOTE_BANNER_2-scaled.jpg" },
] as const;

export function HomeServicesSection({ title = "Χτίζουμε το αύριο των ακαδημιών." }: { title?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const container = root.current;
    const previewElement = preview.current;
    const imageTrack = track.current;
    if (!container || !previewElement || !imageTrack) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const rows = gsap.utils.toArray<HTMLElement>("[data-service-row]");
    const xTo = gsap.quickTo(previewElement, "x", { duration: 0.42, ease: "power3.out" });
    const yTo = gsap.quickTo(previewElement, "y", { duration: 0.42, ease: "power3.out" });
    const rotateTo = gsap.quickTo(previewElement, "rotation", { duration: 0.55, ease: "power3.out" });
    let previousX = window.innerWidth / 2;
    gsap.set(previewElement, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });
    const movePreview = (event: MouseEvent) => {
      const bounds = previewElement.getBoundingClientRect();
      const gutter = 24;
      xTo(gsap.utils.clamp(bounds.width / 2 + gutter, window.innerWidth - bounds.width / 2 - gutter, event.clientX));
      yTo(gsap.utils.clamp(bounds.height / 2 + gutter, window.innerHeight - bounds.height / 2 - gutter, event.clientY));
      rotateTo(gsap.utils.clamp(-4, 4, (event.clientX - previousX) * 0.08));
      previousX = event.clientX;
    };
    const hidePreview = () => gsap.to(previewElement, { scale: 0, autoAlpha: 0, rotation: 0, duration: 0.3, ease: "power2.out", overwrite: "auto" });
    const handleFocusOut = (event: FocusEvent) => {
      if (!container.contains(event.relatedTarget as Node | null)) hidePreview();
    };
    const showPreview = (index: number, event?: FocusEvent) => {
      if (event) { xTo(window.innerWidth / 2); yTo(window.innerHeight / 2); }
      gsap.to(previewElement, { scale: 1, autoAlpha: 1, duration: 0.42, ease: "power3.out", overwrite: "auto" });
      gsap.to(imageTrack, { yPercent: -100 * index, duration: 0.55, ease: "power3.inOut", overwrite: "auto" });
    };
    const rowCleanups = rows.map((row, index) => {
      const enter = () => showPreview(index);
      const focus = (event: FocusEvent) => showPreview(index, event);
      row.addEventListener("mouseenter", enter);
      row.addEventListener("focusin", focus);
      return () => { row.removeEventListener("mouseenter", enter); row.removeEventListener("focusin", focus); };
    });
    container.addEventListener("mousemove", movePreview);
    container.addEventListener("mouseleave", hidePreview);
    container.addEventListener("focusout", handleFocusOut);
    return () => {
      rowCleanups.forEach((cleanup) => cleanup());
      container.removeEventListener("mousemove", movePreview);
      container.removeEventListener("mouseleave", hidePreview);
      container.removeEventListener("focusout", handleFocusOut);
      gsap.killTweensOf([previewElement, imageTrack]);
    };
  }, { scope: root });
  return <section className="home-services section-pad"><div className="home-services-heading"><p className="eyebrow">02 / Τι κάνουμε</p><h2>{title}</h2></div><div ref={root} className="service-list">
    {services.map((service) => <article key={service.title} data-service-row><TransitionLink href="/skopos" className="service-row"><span>{service.index}</span><h3>{service.title}</h3><div className="service-copy"><p>{service.summary}</p><ul>{service.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul></div><div className="service-inline-media"><Image src={service.image} alt={service.title} fill unoptimized sizes="(max-width: 900px) 100vw, 40vw" /></div><span className="service-arrow">↗</span></TransitionLink></article>)}
    <div ref={preview} className="service-preview" aria-hidden="true"><div ref={track} className="service-preview-track">{services.map((service) => <div className="service-preview-frame" key={service.title}><Image src={service.image} alt="" fill unoptimized sizes="420px" /><span className="service-preview-shade" /></div>)}</div></div>
  </div></section>;
}
