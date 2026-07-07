import { GlassCard } from "@/components/ui/GlassCard";
import { Play } from "lucide-react";

export default function RunsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="p-10 text-center">
        <Play className="w-8 h-8 text-slate-500 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Run history coming soon</p>
      </GlassCard>
    </div>
  );
}
