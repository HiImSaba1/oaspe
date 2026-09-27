import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Magnetic } from "@/components/motion/magnetic";
import { cn } from "@/lib/utils";
import { TransitionLink } from "@/components/ui/transition-link";
import { HoverText } from "@/components/ui/hover-text";

export function MagneticFillLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const label = typeof children === "string" ? <HoverText>{children}</HoverText> : children;
  return <Magnetic><TransitionLink href={href} className={cn("magnetic-fill-link", className)}><span aria-hidden="true" className="magnetic-fill-disc" /><span className="magnetic-fill-label">{label}</span><ArrowUpRight /></TransitionLink></Magnetic>;
}
