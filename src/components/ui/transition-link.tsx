"use client";

import Link, { type LinkProps } from "next/link";
import { forwardRef, useRef, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { usePageTransition } from "@/providers/page-transition-provider";
import { useMenuLetterHoverAnimation } from "@/hooks/use-menu-letter-hover-animation";
import { cn } from "@/lib/utils";

type Props = LinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & { href: string };
export const TransitionLink = forwardRef<HTMLAnchorElement, Props>(function TransitionLink({ href, onClick, target, children, ...props }, ref) {
  const { navigateTo } = usePageTransition();
  const internalRef = useRef<HTMLAnchorElement>(null);
  const text = typeof children === "string" ? children : null;
  useMenuLetterHoverAnimation(internalRef, text ?? "");
  const setRef = (node: HTMLAnchorElement | null) => {
    internalRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || target === "_blank" || /^(https?:|mailto:|tel:|#)/.test(href)) return;
    const hoverLabel = event.currentTarget.querySelector<HTMLElement>("[data-hover-text-base]")?.textContent;
    event.preventDefault(); navigateTo(href, event.currentTarget.getAttribute("aria-label") ?? hoverLabel ?? event.currentTarget.textContent ?? undefined);
  };
  return <Link ref={setRef} href={href} target={target} onClick={handleClick} data-transition-link {...props} className={cn(text && "letter-hover-link", props.className)}>{text ? <span className="letter-hover-stack"><span data-hover-text-base>{text}</span><span data-hover-text-active aria-hidden="true">{text}</span></span> : children}</Link>;
});
