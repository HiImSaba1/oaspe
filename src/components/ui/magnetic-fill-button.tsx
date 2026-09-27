"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { ArrowUpRight } from "lucide-react";
import { Magnetic } from "@/components/motion/magnetic";
import { cn } from "@/lib/utils";

export const MagneticFillButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(function MagneticFillButton({ children, className, ...props }, ref) {
  return <Magnetic><button ref={ref} className={cn("magnetic-fill-link", className)} {...props}><span aria-hidden="true" className="magnetic-fill-disc" /><span className="magnetic-fill-label">{children}</span><ArrowUpRight /></button></Magnetic>;
});
