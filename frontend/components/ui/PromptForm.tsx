"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { agentApi } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";

export function PromptForm({
  onSuccess,
}: {
  onSuccess: (jobId: string) => void;
}) {
  const [request, setRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = request.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await agentApi.start(trimmed);
      if (res.success && res.data?.job_id) {
        // Stay in "loading" state — LandingExperience plays the exit
        // transition, then navigates once it finishes.
        onSuccess(res.data.job_id);
      } else {
        setError("Failed to start agent. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Could not connect to the agent. Make sure the backend is running.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <>
      <GlassCard className="p-2" glow="blue">
        <form onSubmit={handleSubmit} noValidate>
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="Create a business proposal for an AI travel company in Hyderabad with budget estimates and risks."
            rows={4}
            disabled={loading}
            aria-label="Describe what you want the agent to do"
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm resize-none outline-none focus:outline-none px-4 pt-4 pb-2 leading-relaxed disabled:opacity-60 rounded-3xl"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e);
              }
            }}
          />
          <div className="flex items-center justify-between px-4 pb-3">
            <span className="text-xs text-slate-600" aria-hidden="true">
              ⌘ + Enter to submit
            </span>
            <button
              type="submit"
              disabled={!request.trim() || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Planning...
                </>
              ) : (
                <>
                  Generate Plan
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      </GlassCard>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-xs text-center mt-3"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </motion.p>
      )}
    </>
  );
}
