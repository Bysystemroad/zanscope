import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:bg-white/8 focus:ring-2 focus:ring-white/30",
        className
      )}
      {...props}
    />
  );
}
