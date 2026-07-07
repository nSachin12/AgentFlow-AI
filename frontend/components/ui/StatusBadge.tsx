import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types";

const config: Record<JobStatus, { label: string; color: string; dot: string }> = {
  CREATED: { label: "Created", color: "text-slate-400 bg-slate-400/10 border-slate-400/20", dot: "bg-slate-400" },
  PLANNED: { label: "Planned", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", dot: "bg-blue-400" },
  RUNNING: { label: "Running", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", dot: "bg-cyan-400 animate-pulse" },
  GENERATING_DOCUMENT: { label: "Generating", color: "text-purple-400 bg-purple-400/10 border-purple-400/20", dot: "bg-purple-400 animate-pulse" },
  COMPLETED: { label: "Completed", color: "text-green-400 bg-green-400/10 border-green-400/20", dot: "bg-green-400" },
  FAILED: { label: "Failed", color: "text-red-400 bg-red-400/10 border-red-400/20", dot: "bg-red-400" },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const { label, color, dot } = config[status] ?? config.CREATED;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border", color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
