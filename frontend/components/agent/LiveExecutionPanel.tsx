"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ThinkingDots } from "@/components/ui/ThinkingDots";
import { cn, formatSeconds } from "@/lib/utils";
import type { JobStatus } from "@/types";
import { Bot, Brain, FileText, Sparkles, XCircle, type LucideIcon } from "lucide-react";

const AGENT_ICONS: Array<{ match: string; icon: LucideIcon; color: string }> = [
  { match: "planner", icon: Brain, color: "text-blue-400" },
  { match: "executor", icon: Bot, color: "text-cyan-400" },
  { match: "reflection", icon: Sparkles, color: "text-purple-400" },
  { match: "document", icon: FileText, color: "text-green-400" },
];

function resolveAgent(currentAgent: string | null, status: JobStatus) {
  if (status === "FAILED") return { icon: XCircle, color: "text-red-400" };
  const normalized = currentAgent?.toLowerCase() ?? "";
  const found = AGENT_ICONS.find((entry) => normalized.includes(entry.match));
  return found ?? { icon: Brain, color: "text-slate-400" };
}

const TERMINAL: JobStatus[] = ["COMPLETED", "FAILED"];

export function LiveExecutionPanel({
  status,
  currentAgent,
  currentTask,
  currentActivity,
  startedAt,
  elapsedTime,
}: {
  status: JobStatus;
  currentAgent: string | null;
  currentTask: string | null;
  currentActivity: string | null;
  startedAt: string | null;
  elapsedTime: number;
}) {
  const [displayElapsed, setDisplayElapsed] = useState(elapsedTime);
  const lastServerValue = useRef(elapsedTime);

  // Reconcile with the backend value whenever a fresh poll arrives.
  useEffect(() => {
    if (Math.abs(elapsedTime - lastServerValue.current) >= 1) {
      setDisplayElapsed(elapsedTime);
    }
    lastServerValue.current = elapsedTime;
  }, [elapsedTime]);

  // Tick locally every second so the clock feels alive between polls.
  useEffect(() => {
    if (TERMINAL.includes(status) || !startedAt) return;

    const started = new Date(startedAt).getTime();
    const id = setInterval(() => {
      setDisplayElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    }, 1000);

    return () => clearInterval(id);
  }, [status, startedAt]);

  const isWorking = !TERMINAL.includes(status);
  const agent = resolveAgent(currentAgent, status);
  const AgentIcon = agent.icon;

  return (
    <GlassCard className="p-5" glow={status === "FAILED" ? "none" : status === "COMPLETED" ? "green" : "blue"}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Execution</h3>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 relative flex-shrink-0", agent.color)}>
            {isWorking && <span className="absolute inset-0 rounded-xl animate-ping bg-current opacity-10" />}
            <AgentIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Current Agent</p>
            <p className={cn("text-sm font-semibold truncate", agent.color)}>
              {currentAgent ?? "Initializing"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Elapsed Time</p>
          <p className="text-sm font-semibold text-white tabular-nums">{formatSeconds(displayElapsed)}</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 sm:col-span-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Current Task</p>
          <p className="text-xs text-slate-200 truncate">
            {status === "COMPLETED" ? "✅ All tasks completed" : currentTask ?? "Waiting for task..."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 sm:col-span-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Current Activity</p>
          <div className="flex items-center gap-2">
            <motion.p
              key={currentActivity}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-blue-300 font-mono truncate"
            >
              {currentActivity ?? "Standing by..."}
            </motion.p>
            {isWorking && <ThinkingDots className="text-blue-300 flex-shrink-0" />}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
