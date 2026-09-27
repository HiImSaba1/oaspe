import Image from "next/image";
import { cn } from "@/lib/utils";

const sources = {
  dark: "/images/wordpress/2024/10/oaspe-logo-nobg.png",
  light: "/images/wordpress/2024/10/oaspe-logo-nobg.png",
} as const;

export function OaspeLogo({ variant = "dark", className, priority = false }: { variant?: keyof typeof sources; className?: string; priority?: boolean }) {
  return <span className={cn("oaspe-logo-frame", className)}><Image className="oaspe-logo" src={sources[variant]} fill sizes="(max-width: 600px) 260px, 520px" alt="ΟΑΣΠΕ" priority={priority} unoptimized /></span>;
}
