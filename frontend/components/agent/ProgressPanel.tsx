"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTypingText } from "@/hooks/useTypingText";
import type { JobStatus, PlanStep } from "@/types";
import { CheckCircle2, Circle, Loader2, Brain, Bot, Sparkles, FileText, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const thinkingTexts: Record<JobStatus, string[]> = {
  CREATED: ["Initializing agent..."],
  PLANNED: ["Plan ready. Starting execution...", "Preparing executor..."],
  RUNNING: [
    "Executor working...",
    "Processing step...",
    "Analyzing data...",
    "Generating insights...",
    "Researching topic...",
  ],
  GENERATING_DOCUMENT: [
    "Reflection reviewing...",
    "Validating outputs...",
    "Generating document...",
    "Formatting sections...",
  ],
  COMPLETED: ["All tasks completed.", "Document ready for download."],
  FAILED: ["Execution failed."],
};

const currentAgentConfig: Record<
  JobStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  CREATED: { label: "Initializing", icon: Brain, color: "text-slate-400" },
  PLANNED: { label: "Planner Agent", icon: Brain, color: "text-blue-400" },
  RUNNING: { label: "Executor Agent", icon: Bot, color: "text-cyan-400" },
  GENERATING_DOCUMENT: { label: "Reflection Agent", icon: Sparkles, color: "text-purple-400" },
  COMPLETED: { label: "Document Generator", icon: FileText, color: "text-green-400" },
  FAILED: { label: "Agent Failed", icon: XCircle, color: "text-red-400" },
};

export function ProgressPanel({
  status,
  progress,
  currentStep,
  totalSteps,
  assumptions,
  plan,
  hideStatusCard = false,
  hideDetails = false,
}: {
  status: JobStatus;
  progress: number;
  currentStep: number;
  totalSteps: number;
  assumptions: string[];
  plan: PlanStep[];
  // Renders just the Assumptions/Execution Plan sections, without the status card
  hideStatusCard?: boolean;
  // Renders just the status card, without Assumptions/Execution Plan
  hideDetails?: boolean;
}) {
  const texts = thinkingTexts[status] ?? ["Processing..."];
  const typed = useTypingText(texts, 55, 2500);
  const agentInfo = currentAgentConfig[status];
  const AgentIcon = agentInfo.icon;

  const isTerminal = status === "COMPLETED" || status === "FAILED";
  const isFailed = status === "FAILED";

  // Find the current active step — use step.status from backend, not array index
  const currentStepTitle = useMemo(() => {
    const active = plan.find((s) => s.status === "pending");
    return active?.title ?? null;
  }, [plan]);

  const cardGlow = isFailed ? "none" : status === "COMPLETED" ? "green" : "blue";

  return (
    <div className="space-y-4">
      {/* Status Card */}
      {!hideStatusCard && (
      <GlassCard className="p-5" glow={cardGlow}>
        {/* Current Agent */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              isFailed ? "bg-red-500/15" : "bg-white/5"
            )}
          >
            <AgentIcon className={cn("w-4 h-4", agentInfo.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Current Agent
            </p>
            <p className={cn("text-sm font-semibold", agentInfo.color)}>
              {agentInfo.label}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Progress bar */}
        <div
          className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Execution progress"
        >
          <motion.div
            className={cn(
              "h-full rounded-full",
              isFailed
                ? "bg-red-500"
                : "bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
          <span>
            Step {currentStep} of {totalSteps}
          </span>
          <span className="tabular-nums">{progress}%</span>
        </div>

        {/* Current task */}
        {currentStepTitle && !isTerminal && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-white/3 border border-white/5">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
              Current Task
            </p>
            <p className="text-xs text-slate-200 truncate">{currentStepTitle}</p>
          </div>
        )}

        {/* Typing indicator */}
        {!isTerminal && (
          <div
            className="flex items-center gap-2 text-xs text-blue-300 font-mono"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
            <span>{typed}</span>
            <span className="animate-pulse" aria-hidden="true">|</span>
          </div>
        )}

        {status === "COMPLETED" && (
          <p className="text-xs text-green-400 font-medium">
            ✓ All tasks completed successfully
          </p>
        )}
      </GlassCard>
      )}

      {hideDetails ? null : (
      <>
      {/* Assumptions */}
      {assumptions.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Assumptions
          </h3>
          <ul className="space-y-2">
            {assumptions.map((a, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2 text-xs text-slate-300"
              >
                <span className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                {a}
              </motion.li>
            ))}
          </ul>
        </GlassCard>
      )}

      {/* Plan Steps */}
      {plan.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Execution Plan
          </h3>
          <div className="space-y-2" role="list" aria-label="Execution plan steps">
            {plan.map((step, i) => {
              // Use backend step.status — not array index comparison
              const isActive =
                step.status === "pending" &&
                plan.findIndex((s) => s.status === "pending") === i;
              const isFailed = step.status === "failed";

              return (
                <motion.div
                  key={step.step}
                  role="listitem"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-xl text-xs transition-all",
                    step.status === "completed" && "bg-green-500/5",
                    isActive && "bg-blue-500/10 border border-blue-500/20",
                    isFailed && "bg-red-500/10 border border-red-500/20",
                    step.status === "pending" && !isActive && "opacity-50"
                  )}
                >
                  {step.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" aria-label="Completed" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" aria-label="In progress" />
                  ) : isFailed ? (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" aria-label="Failed" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" aria-label="Pending" />
                  )}
                  <span
                    className={cn(
                      step.status === "completed"
                        ? "text-green-300"
                        : isActive
                        ? "text-blue-300"
                        : isFailed
                        ? "text-red-300"
                        : "text-slate-500"
                    )}
                  >
                    {step.title}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>
      )}
      </>
      )}
    </div>
  );
}
