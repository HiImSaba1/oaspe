"use client";

import type { ComponentProps } from "react";
import { TransitionLink } from "@/components/ui/transition-link";

type Props = Omit<ComponentProps<typeof TransitionLink>, "children"> & { children: string };

export function LetterHoverLink({ children, className, ...props }: Props) {
  return <TransitionLink className={className} {...props}>{children}</TransitionLink>;
}
