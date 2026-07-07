"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Bot, FileText, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PromptForm } from "@/components/ui/PromptForm";

const features = [
  {
    icon: Brain,
    title: "Autonomous Planning",
    description:
      "AI decomposes your request into a structured execution plan with assumptions.",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Bot,
    title: "Multi-Step Execution",
    description:
      "Each step is executed autonomously with real-time progress tracking.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: FileText,
    title: "Document Generation",
    description: "Outputs a professional Word document ready for download.",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
];

// How long the exit transform+fade takes before we navigate to the workflow
// view — must match the motion.div's own transition duration below.
const EXIT_DURATION_S = 0.55;

export function LandingExperience() {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  const handleSuccess = (jobId: string) => {
    setIsLeaving(true);
    setTimeout(() => {
      router.push(`/agent/${jobId}`);
    }, EXIT_DURATION_S * 1000);
  };

  return (
    <AnimatePresence>
      {!isLeaving && (
        <motion.div
          key="landing"
          exit={{ opacity: 0, y: 80, scale: 0.94 }}
          transition={{ duration: EXIT_DURATION_S, ease: [0.4, 0, 0.2, 1] }}
          className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-16 text-center"
        >
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium mb-6">
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              Powered by Autonomous AI
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-5">
              <span className="text-white">Autonomous</span>{" "}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                AI Agent
              </span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Transform natural language requests into professional business
              documents through autonomous planning, execution and reflection.
            </p>
          </div>

          {/* Prompt Box */}
          <div className="w-full max-w-2xl mb-12">
            <PromptForm onSuccess={handleSuccess} />
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
            {features.map(({ icon: Icon, title, description, color, bg }) => (
              <GlassCard
                key={title}
                className="p-5 h-full hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${bg}`}
                >
                  <Icon className={`w-4 h-4 ${color}`} aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
              </GlassCard>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
