"use client";

import { AnimatedTitle } from "@/components/motion/animated-title";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { ContactForm } from "@/components/forms/contact-form";
import { TransitionLink } from "@/components/ui/transition-link";

export function ContactLayout() {
  return <main className="contact-page route-hero-enter">
    <section className="contact-hero">
      <ParallaxImage src="/images/wordpress/2016/02/goneis_paidia_17.jpg" alt="" priority speed={24} sizes="100vw" className="contact-hero-media hero-parallax-background" imageClassName="hero-cover-image" />
      <div className="contact-hero-shade" />
      <h1 className="contact-hero-title">
        <AnimatedTitle as="span" type="words">Ας κάνουμε</AnimatedTitle>
        <AnimatedTitle as="span" type="words" delay={.08}>την επόμενη</AnimatedTitle>
        <AnimatedTitle as="span" type="words" delay={.16}>κίνηση να μετρά</AnimatedTitle>
      </h1>
    </section>
    <section className="contact-body section-pad">
      <aside className="contact-details"><p className="section-index">Άμεση επικοινωνία</p><div><TransitionLink href="mailto:info@oaspe.org">info@oaspe.org</TransitionLink><p>Ελλάδα</p></div><p>Πείτε μας πώς μπορούμε να βοηθήσουμε. Θα διαβάσουμε προσεκτικά το μήνυμά σας και θα απαντήσουμε το συντομότερο δυνατό.</p></aside>
      <div><p className="section-index contact-form-label">Στείλτε το μήνυμά σας</p><ContactForm /></div>
    </section>
  </main>;
}
