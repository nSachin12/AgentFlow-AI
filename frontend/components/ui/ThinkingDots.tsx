"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThinkingDots({ className, dotClassName }: { className?: string; dotClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={cn("h-1 w-1 rounded-full bg-current", dotClassName)}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}
