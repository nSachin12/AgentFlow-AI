import { GlassCard } from "@/components/ui/GlassCard";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="p-10 text-center">
        <Settings className="w-8 h-8 text-slate-500 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Settings coming soon</p>
      </GlassCard>
    </div>
  );
}
