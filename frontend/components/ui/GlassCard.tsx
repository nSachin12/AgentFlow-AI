import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: "blue" | "purple" | "cyan" | "green" | "none";
}

export function GlassCard({ children, className, glow = "none", ...props }: GlassCardProps) {
  const glowMap = {
    blue: "shadow-[0_0_30px_rgba(59,130,246,0.15)] border-blue-500/20",
    purple: "shadow-[0_0_30px_rgba(139,92,246,0.15)] border-purple-500/20",
    cyan: "shadow-[0_0_30px_rgba(6,182,212,0.15)] border-cyan-500/20",
    green: "shadow-[0_0_30px_rgba(34,197,94,0.15)] border-green-500/20",
    none: "border-white/10",
  };

  return (
    <div
      className={cn(
        "rounded-3xl border bg-white/5 backdrop-blur-xl overflow-hidden",
        glowMap[glow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
