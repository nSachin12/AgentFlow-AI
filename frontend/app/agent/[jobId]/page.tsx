"use client";

import { use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, ListTree, X, Layers } from "lucide-react";
import Link from "next/link";
import { useAgentExecution } from "@/hooks/useAgentExecution";
import { WorkflowGraph, type PipelineNodeId } from "@/components/agent/WorkflowGraph";
import { ProgressPanel } from "@/components/agent/ProgressPanel";
import { Timeline } from "@/components/agent/Timeline";
import { ResultSection } from "@/components/agent/ResultSection";
import { LiveExecutionPanel } from "@/components/agent/LiveExecutionPanel";
import { ExecutionStats } from "@/components/agent/ExecutionStats";
import { GlassCard } from "@/components/ui/GlassCard";
import type { WorkflowNodeSnapshot } from "@/types";

export default function AgentPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const { state, retry } = useAgentExecution(jobId);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<PipelineNodeId | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeSnapshot | null>(null);

  const isFailed = state.status === "FAILED";
  // Show results as steps complete, not just once the whole job finishes.
  const showResults = state.generatedContent.length > 0 || !!state.documentUrl;

  const handleNodeSelect = (node: WorkflowNodeSnapshot) => {
    setSelectedNodeId(node.id as PipelineNodeId);
    setSelectedNode(node);
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back
        </Link>
        <div className="h-4 w-px bg-white/10" aria-hidden="true" />
        <div>
          <p className="text-xs text-slate-500">Job ID</p>
          <p className="text-xs font-mono text-slate-300 select-all">{jobId}</p>
        </div>

        <button
          onClick={() => setTimelineOpen(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-medium hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
          aria-label="Open event timeline"
        >
          <ListTree className="w-3.5 h-3.5" aria-hidden="true" />
          Timeline
        </button>

        {/* Retry button — only shown on FAILED */}
        {isFailed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={retry}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            aria-label="Retry agent execution"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Retry
          </motion.button>
        )}
      </motion.div>

      {/* FAILED error banner */}
      {isFailed && state.error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-xs font-semibold text-red-400 mb-1">
            Agent execution failed
          </p>
          <p className="text-xs text-red-300">{state.error}</p>
        </motion.div>
      )}

      {/* Compact status strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-4"
      >
        {state.isLoading && state.plan.length === 0 ? (
          <LoadingSkeleton compact />
        ) : (
          <ProgressPanel
            status={state.status}
            progress={state.progress}
            currentStep={state.currentStep}
            totalSteps={state.totalSteps}
            assumptions={state.assumptions}
            plan={state.plan}
            hideDetails
          />
        )}
      </motion.div>

      {/* Live execution + stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6"
      >
        <LiveExecutionPanel
          status={state.status}
          currentAgent={state.currentAgent}
          currentTask={state.currentTask}
          currentActivity={state.currentActivity}
          startedAt={state.startedAt}
          elapsedTime={state.elapsedTime}
        />
        <ExecutionStats
          totalSteps={state.totalSteps}
          currentStep={state.currentStep}
          elapsedTime={state.elapsedTime}
          tokensUsed={state.tokensUsed}
        />
      </motion.div>

      {/* Full-bleed n8n-style workflow canvas */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden mb-6"
        style={{ height: "72vh", minHeight: 480 }}
      >
        <WorkflowGraph
          status={state.status}
          events={state.events}
          plan={state.plan}
          generatedContent={state.generatedContent}
          currentAgent={state.currentAgent}
          currentTask={state.currentTask}
          currentActivity={state.currentActivity}
          elapsedTime={state.elapsedTime}
          selectedNodeId={selectedNodeId}
          onNodeSelect={handleNodeSelect}
        />
      </motion.div>

      {/* Details: assumptions + execution plan, below the canvas */}
      {(state.assumptions.length > 0 || state.plan.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center gap-4 mb-6"
        >
          <div className="w-full max-w-3xl">
          <ProgressPanel
            status={state.status}
            progress={state.progress}
            currentStep={state.currentStep}
            totalSteps={state.totalSteps}
            assumptions={state.assumptions}
            plan={state.plan}
            hideStatusCard
          />
          </div>
        </motion.div>
      )}

      {/* Results — reveal progressively as each step completes, not just at the end */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ResultSection
              generatedContent={state.generatedContent}
              documentUrl={state.documentUrl}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline drawer */}
      <AnimatePresence>
        {timelineOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setTimelineOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 h-screen w-full sm:w-96 z-50 p-4"
            >
              <div className="relative h-full">
                <button
                  onClick={() => setTimelineOpen(false)}
                  className="absolute -top-1 -left-1 z-10 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  aria-label="Close timeline"
                >
                  <X className="w-4 h-4" />
                </button>
                <Timeline events={state.events} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Node detail drawer — opens when an agent node is clicked */}
      <AnimatePresence>
        {selectedNode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => {
                setSelectedNode(null);
                setSelectedNodeId(null);
              }}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 h-screen w-full sm:w-96 z-50 p-4"
            >
              <div className="relative h-full">
                <button
                  onClick={() => {
                    setSelectedNode(null);
                    setSelectedNodeId(null);
                  }}
                  className="absolute -top-1 -left-1 z-10 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  aria-label="Close node details"
                >
                  <X className="w-4 h-4" />
                </button>
                <GlassCard className="p-5 h-full overflow-y-auto space-y-5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-300" aria-hidden="true" />
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Agent Node
                    </h3>
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-white">{selectedNode.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{selectedNode.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">State</p>
                      <p className="text-slate-200 capitalize">{selectedNode.state}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Execution Time</p>
                      <p className="text-slate-200">{selectedNode.executionTime}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Current Activity</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.currentActivity}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Output Summary</p>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedNode.summary}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Inputs</p>
                    <ul className="space-y-1">
                      {selectedNode.inputs.map((input) => (
                        <li key={input} className="text-xs text-slate-300 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-cyan-400 flex-shrink-0" />
                          {input}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Outputs</p>
                    <ul className="space-y-1">
                      {selectedNode.outputs.map((output) => (
                        <li key={output} className="text-xs text-slate-300 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                          {output}
                        </li>
                      ))}
                    </ul>
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <GlassCard className="p-5 space-y-4" aria-busy="true" aria-label="Loading agent state">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/5 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-2 w-20 bg-white/5 rounded animate-pulse" />
          <div className="h-3 w-32 bg-white/8 rounded animate-pulse" />
        </div>
        <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse" />
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full animate-pulse" />
      {!compact && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-white/3 rounded-xl animate-pulse" />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
