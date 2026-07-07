"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { getEventLabel, formatTimestamp } from "@/lib/utils";
import type { AgentEvent } from "@/types";
import { Brain, Bot, Sparkles, FileText, Upload, Zap } from "lucide-react";

const agentIcons: Record<string, React.ElementType> = {
  planner: Brain,
  executor: Bot,
  reflection: Sparkles,
  document: FileText,
  storage: Upload,
};

const agentColors: Record<string, string> = {
  planner: "text-blue-400 bg-blue-500/15 border-blue-500/20",
  executor: "text-cyan-400 bg-cyan-500/15 border-cyan-500/20",
  reflection: "text-purple-400 bg-purple-500/15 border-purple-500/20",
  document: "text-green-400 bg-green-500/15 border-green-500/20",
  storage: "text-orange-400 bg-orange-500/15 border-orange-500/20",
};

export function Timeline({ events }: { events: AgentEvent[] }) {
  // Reverse once — stable reference, newest first
  const reversed = [...events].reverse();

  return (
    <GlassCard className="p-5 h-full flex flex-col">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex-shrink-0">
        Event Timeline
      </h3>

      {events.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-8 text-slate-600 flex-1"
          aria-live="polite"
        >
          <Zap className="w-6 h-6 mb-2" aria-hidden="true" />
          <p className="text-xs">Waiting for events...</p>
        </div>
      ) : (
        <div
          className="space-y-3 overflow-y-auto flex-1 pr-1"
          role="log"
          aria-label="Agent event timeline"
          aria-live="polite"
        >
          <AnimatePresence initial={false}>
            {reversed.map((ev) => {
              // Stable key: timestamp + agent + event — never uses array index
              const key = `${ev.timestamp}::${ev.agent}::${ev.event}`;
              const Icon = agentIcons[ev.agent] ?? Zap;
              const colorClass =
                agentColors[ev.agent] ?? "text-slate-400 bg-white/5 border-white/10";

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${colorClass}`}
                    aria-hidden="true"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white leading-tight">
                      {getEventLabel(ev.event)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      <time dateTime={ev.timestamp}>{formatTimestamp(ev.timestamp)}</time>
                    </p>
                    {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                      <p className="text-[10px] text-slate-600 mt-0.5 truncate">
                        {JSON.stringify(ev.metadata)}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </GlassCard>
  );
}
