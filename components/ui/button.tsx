import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary:
      "bg-white text-[#080f14] shadow-[0_0_28px_rgba(255,255,255,0.16)] hover:bg-[#f1f4f6] hover:shadow-[0_0_38px_rgba(255,255,255,0.24)]",
    secondary: "border border-white/10 bg-secondary/80 text-secondary-foreground hover:bg-secondary",
    ghost: "text-foreground hover:bg-white/8",
    outline: "border border-white/12 bg-white/4 text-foreground hover:bg-white/10"
  };

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
