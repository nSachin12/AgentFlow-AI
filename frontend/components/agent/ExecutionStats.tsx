"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { formatSeconds } from "@/lib/utils";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-center">
      <p className="text-lg font-semibold text-white tabular-nums">{value}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

export function ExecutionStats({
  totalSteps,
  currentStep,
  elapsedTime,
  tokensUsed,
}: {
  totalSteps: number;
  currentStep: number;
  elapsedTime: number;
  tokensUsed: number;
}) {
  const completed = Math.min(currentStep, totalSteps);
  const remaining = Math.max(totalSteps - completed, 0);

  return (
    <GlassCard className="p-5">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Execution Stats</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <StatTile label="Total Steps" value={String(totalSteps)} />
        <StatTile label="Completed" value={String(completed)} />
        <StatTile label="Remaining" value={String(remaining)} />
        <StatTile label="Duration" value={formatSeconds(elapsedTime)} />
        <StatTile label="Tokens" value={tokensUsed > 0 ? tokensUsed.toLocaleString() : "—"} />
      </div>
    </GlassCard>
  );
}
