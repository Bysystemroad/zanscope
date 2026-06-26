import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({ className, href = "/" }: { className?: string; href?: string }) {
  const content = (
    <span className={cn("flex items-center", className)}>
      <img
        src="/zanscope-logo.png"
        alt="Zanscope"
        className="h-[60px] w-auto object-contain drop-shadow-[0_0_18px_rgba(255,255,255,0.18)]"
      />
    </span>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
