"use client";

import { memo, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  type Edge,
  type Node,
  MarkerType,
  Position,
  Handle,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Brain,
  FileText,
  RefreshCw,
  Sparkles,
  User,
  CheckCircle2,
} from "lucide-react";
import { cn, formatSeconds } from "@/lib/utils";
import { ThinkingDots } from "@/components/ui/ThinkingDots";
import type { AgentEvent, GeneratedContent, JobStatus, PlanStep, WorkflowNodeSnapshot } from "@/types";

type NodeState = "active" | "completed" | "pending" | "failed" | "retrying";
type LayoutMode = "horizontal" | "vertical";

interface RetryInfo {
  attempt: number;
  maxRetries: number;
}

interface AgentNodeData {
  label: string;
  description: string;
  icon: React.ElementType;
  state: NodeState;
  summary: string;
  activity: string;
  selected: boolean;
  layout: LayoutMode;
  inputs: string[];
  outputs: string[];
  retryInfo: RetryInfo | null;
  onSelect: (id: string) => void;
}

export type PipelineNodeId = "user" | "planner" | "executor" | "reflection" | "document" | "final";

const BASE_NODE_IDS: PipelineNodeId[] = [
  "user",
  "planner",
  "executor",
  "reflection",
  "document",
  "final",
];

const NODE_TITLES: Record<PipelineNodeId, string> = {
  user: "User",
  planner: "Planner Agent",
  executor: "Executor Agent",
  reflection: "Reflection Agent",
  document: "Document Generator",
  final: "Final Report",
};

const NODE_DESCRIPTIONS: Record<PipelineNodeId, string> = {
  user: "Incoming request and objectives",
  planner: "Creates the execution plan",
  executor: "Performs the long-running work",
  reflection: "Reviews the executed outputs",
  document: "Assembles the final deliverable",
  final: "Published report and download",
};

const NODE_ICONS: Record<PipelineNodeId, React.ElementType> = {
  user: User,
  planner: Brain,
  executor: Bot,
  reflection: Sparkles,
  document: FileText,
  final: FileText,
};

const NODE_INPUTS: Record<PipelineNodeId, string[]> = {
  user: ["User prompt"],
  planner: ["User prompt", "Project context"],
  executor: ["Execution plan", "Latest outputs"],
  reflection: ["Executor outputs", "Step results"],
  document: ["Reviewed outputs", "Reflection feedback"],
  final: ["Generated document"],
};

const NODE_OUTPUTS: Record<PipelineNodeId, string[]> = {
  user: ["Execution request"],
  planner: ["Plan steps", "Assumptions"],
  executor: ["Step outputs"],
  reflection: ["Review feedback"],
  document: ["Final document"],
  final: ["Download link"],
};

function AgentNode({ data }: { data: AgentNodeData }) {
  const {
    label,
    description,
    icon: Icon,
    state,
    summary,
    activity,
    selected,
    layout,
    inputs,
    outputs,
    retryInfo,
    onSelect,
  } = data;

  const horizontal = layout === "horizontal";
  const handlePosition = horizontal ? Position.Left : Position.Top;
  const sourcePosition = horizontal ? Position.Right : Position.Bottom;

  const stateStyles: Record<NodeState, string> = {
    active:
      "border-blue-400/60 bg-blue-500/10 shadow-[0_0_28px_rgba(59,130,246,0.35)]",
    completed:
      "border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_24px_rgba(34,197,94,0.25)]",
    pending: "border-white/10 bg-white/5",
    failed: "border-red-400/60 bg-red-500/10 shadow-[0_0_24px_rgba(239,68,68,0.3)]",
    retrying:
      "border-amber-400/70 bg-amber-500/10 shadow-[0_0_28px_rgba(245,158,11,0.4)]",
  };

  const iconStyles: Record<NodeState, string> = {
    active: "text-blue-300 bg-blue-500/20",
    completed: "text-emerald-300 bg-emerald-500/20",
    pending: "text-slate-500 bg-white/5",
    failed: "text-red-300 bg-red-500/20",
    retrying: "text-amber-300 bg-amber-500/20",
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(label.toLowerCase().includes("user") ? "user" : label.toLowerCase().includes("planner") ? "planner" : label.toLowerCase().includes("executor") ? "executor" : label.toLowerCase().includes("reflection") ? "reflection" : label.toLowerCase().includes("document") ? "document" : "final")}
      className={cn(
        "text-left rounded-3xl border backdrop-blur-xl p-4 transition-all duration-300 outline-none",
        horizontal ? "w-[18rem]" : "w-[17rem]",
        stateStyles[state],
        selected && "ring-2 ring-cyan-400/70 scale-[1.02]"
      )}
    >
      <Handle
        type="target"
        position={handlePosition}
        className="!bg-white/15 !border-white/10 !w-3 !h-3"
      />
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0",
            iconStyles[state]
          )}
        >
          {state === "retrying" ? (
            <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: "1.2s" }} />
          ) : state === "completed" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Icon className="w-5 h-5" />
          )}
          {(state === "active" || state === "retrying") && (
            <span
              className={cn(
                "absolute inset-0 rounded-2xl animate-ping",
                state === "retrying" ? "bg-amber-400/20" : "bg-blue-400/20"
              )}
            />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{label}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">{description}</p>
            </div>
            <span
              className={cn(
                "text-[10px] px-2 py-1 rounded-full border capitalize whitespace-nowrap",
                state === "active" && "text-blue-300 border-blue-400/30 bg-blue-500/10",
                state === "completed" && "text-emerald-300 border-emerald-400/30 bg-emerald-500/10",
                state === "pending" && "text-slate-400 border-white/10 bg-white/5",
                state === "failed" && "text-red-300 border-red-400/30 bg-red-500/10",
                state === "retrying" && "text-amber-300 border-amber-400/30 bg-amber-500/10"
              )}
            >
              {state}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 min-h-[2.4rem]">
            {summary}
          </p>

          {(state === "active" || state === "retrying") && (
          <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10">
              {activity}
              {state === "active" && <ThinkingDots className="text-blue-300" />}
            </span>
            {retryInfo && (
              <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-300">
                Retry {retryInfo.attempt}/{retryInfo.maxRetries}
              </span>
            )}
          </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-2">
              <p className="uppercase tracking-wider text-slate-500 mb-1">Inputs</p>
              <p className="text-slate-300 leading-relaxed">{inputs.join(" · ")}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-2">
              <p className="uppercase tracking-wider text-slate-500 mb-1">Outputs</p>
              <p className="text-slate-300 leading-relaxed">{outputs.join(" · ")}</p>
            </div>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={sourcePosition}
        className="!bg-white/15 !border-white/10 !w-3 !h-3"
      />
    </button>
  );
}

const nodeTypes = { agentNode: memo(AgentNode) };

function normalizeLabel(value: string | null | undefined): string {
  return value ? value.trim().toLowerCase() : "";
}

function truncate(text: string | null | undefined, maxLength = 120): string {
  if (!text) return "";
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1)}…`;
}

function getRetryInfo(events: AgentEvent[], agent: string): RetryInfo | null {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].agent !== agent || events[i].event !== "retrying") continue;

    const attempt = Number(events[i].metadata?.attempt);
    const maxRetries = Number(events[i].metadata?.max_retries);
    return {
      attempt: Number.isFinite(attempt) ? attempt : 1,
      maxRetries: Number.isFinite(maxRetries) ? maxRetries : 3,
    };
  }

  return null;
}

function getLastEventForAgent(events: AgentEvent[], agent: string): AgentEvent | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].agent === agent) return events[i];
  }
  return undefined;
}

function getLatestGeneratedContent(
  generatedContent: GeneratedContent[],
  matchers: string[]
): GeneratedContent | undefined {
  const normalizedMatchers = matchers.map(normalizeLabel);
  for (let i = generatedContent.length - 1; i >= 0; i--) {
    const title = normalizeLabel(generatedContent[i].title);
    if (normalizedMatchers.some((matcher) => title.includes(matcher))) {
      return generatedContent[i];
    }
  }
  return generatedContent[generatedContent.length - 1];
}

function buildSnapshot({
  id,
  label,
  description,
  state,
  summary,
  currentActivity,
  inputs,
  outputs,
  executionTime,
}: {
  id: PipelineNodeId;
  label: string;
  description: string;
  state: NodeState;
  summary: string;
  currentActivity: string;
  inputs: string[];
  outputs: string[];
  executionTime: string;
}): WorkflowNodeSnapshot {
  return {
    id,
    label,
    description,
    state,
    summary,
    currentActivity,
    inputs,
    outputs,
    executionTime,
  };
}

function deriveNodeState(
  id: PipelineNodeId,
  status: JobStatus,
  currentAgent: string | null,
  events: AgentEvent[]
): NodeState {
  const agent = normalizeLabel(currentAgent);
  const isFailed = status === "FAILED";

  if (id === "user") return "completed";

  if (isFailed) {
    const lastPipelineEvent = [...events]
      .reverse()
      .find((event) => ["planner", "executor", "reflection", "document"].includes(event.agent));

    if (lastPipelineEvent?.agent === id) return "failed";
  }

  const isActive =
    status !== "COMPLETED" && (
    (id === "planner" && (agent.includes("planner") || status === "CREATED")) ||
    (id === "executor" && agent.includes("executor")) ||
    (id === "reflection" && agent.includes("reflection")) ||
    (id === "document" && agent.includes("document"))
    );

  if (isActive) return "active";

  if (status === "COMPLETED") return "completed";

  if (id === "planner") {
    return ["RUNNING", "GENERATING_DOCUMENT", "COMPLETED"].includes(status)
      ? "completed"
      : status === "FAILED"
      ? "failed"
      : "completed";
  }

  if (id === "executor") {
    return ["GENERATING_DOCUMENT", "COMPLETED"].includes(status)
      ? "completed"
      : events.some((event) => event.agent === "executor" && event.event === "step_started")
      ? "completed"
      : "pending";
  }

  if (id === "reflection") {
    return ["COMPLETED"].includes(status)
      ? "completed"
      : events.some((event) => event.agent === "reflection" && event.event === "reflection_started")
      ? "completed"
      : "pending";
  }

  if (id === "document") {
    return agent.includes("document")
      ? "active"
      : status === "GENERATING_DOCUMENT"
      ? "active"
      : "pending";
  }

  return "pending";
}

function getActiveNodeId(
  status: JobStatus,
  currentAgent: string | null,
  events: AgentEvent[]
): PipelineNodeId {
  const agent = normalizeLabel(currentAgent);

  if (status === "COMPLETED") return "final";
  if (status === "GENERATING_DOCUMENT" && agent.includes("document")) return "document";
  if (status === "GENERATING_DOCUMENT" && agent.includes("reflection")) return "reflection";
  if (agent.includes("executor")) return "executor";
  if (agent.includes("reflection")) return "reflection";
  if (agent.includes("document")) return "document";

  const lastPipelineEvent = [...events]
    .reverse()
    .find((event) => ["planner", "executor", "reflection", "document"].includes(event.agent));

  return (lastPipelineEvent?.agent as PipelineNodeId) ?? "planner";
}

function buildNodeSnapshot(
  id: PipelineNodeId,
  props: {
    status: JobStatus;
    currentAgent: string | null;
    currentTask: string | null;
    currentActivity: string | null;
    elapsedTime: number;
    events: AgentEvent[];
    generatedContent: GeneratedContent[];
    plan: PlanStep[];
  }
): WorkflowNodeSnapshot {
  const { status, currentAgent, currentTask, currentActivity, elapsedTime, events, generatedContent, plan } = props;
  const state = deriveNodeState(id, status, currentAgent, events);
  const latestOutput = getLatestGeneratedContent(
    generatedContent,
    id === "planner"
      ? ["plan", "planner"]
      : id === "executor"
      ? ["step", "output", "executor"]
      : id === "reflection"
      ? ["reflection", "feedback"]
      : id === "document"
      ? ["document", "report"]
      : ["report", "document"]
  );

  const plannerEvent = getLastEventForAgent(events, "planner");
  const executorEvent = getLastEventForAgent(events, "executor");
  const reflectionEvent = getLastEventForAgent(events, "reflection");
  const documentEvent = getLastEventForAgent(events, "document");

  const executionTime =
    id === "planner"
      ? status === "PLANNED"
        ? "Plan complete"
        : formatSeconds(elapsedTime)
      : id === "executor"
      ? executorEvent?.metadata?.step
        ? `Step ${executorEvent.metadata.step}`
        : formatSeconds(elapsedTime)
      : id === "reflection"
      ? reflectionEvent?.event === "reflection_completed"
        ? "Review complete"
        : formatSeconds(elapsedTime)
      : id === "document"
      ? documentEvent?.event === "generated"
        ? "Document ready"
        : formatSeconds(elapsedTime)
      : id === "final"
      ? status === "COMPLETED"
        ? "Published"
        : "Waiting"
      : "Request submitted";

  const summary =
    id === "user"
      ? currentTask ?? "Prompt received"
      : id === "planner"
      ? latestOutput
        ? truncate(latestOutput.content)
        : currentActivity ?? "Creating execution plan"
      : id === "executor"
      ? latestOutput
        ? truncate(latestOutput.content)
        : currentActivity ?? "Working through the step"
      : id === "reflection"
      ? latestOutput
        ? truncate(latestOutput.content)
        : currentActivity ?? "Reviewing results"
      : id === "document"
      ? currentActivity ?? latestOutput?.title ?? "Generating report"
      : plan.length > 0
      ? `${plan.length} steps prepared`
      : "Final report is ready";

  const currentNodeActivity =
    id === "planner"
      ? currentActivity ?? "Creating execution plan..."
      : id === "executor"
      ? currentActivity ?? "Researching pricing models..."
      : id === "reflection"
      ? currentActivity ?? "Reviewing proposal..."
      : id === "document"
      ? currentActivity ?? "Generating document..."
      : id === "final"
      ? status === "COMPLETED"
        ? "Report published"
        : "Awaiting report"
      : "Request accepted";

  return buildSnapshot({
    id,
    label: NODE_TITLES[id],
    description: NODE_DESCRIPTIONS[id],
    state,
    summary,
    currentActivity: currentNodeActivity,
    inputs: NODE_INPUTS[id],
    outputs: NODE_OUTPUTS[id],
    executionTime,
  });
}

function buildEdgeLabel(source: PipelineNodeId, target: PipelineNodeId, status: JobStatus): string | undefined {
  if (status === "COMPLETED") return undefined;

  if (source === "planner" && target === "executor") {
    return status === "PLANNED" || status === "RUNNING" ? "sending plan" : undefined;
  }

  if (source === "executor" && target === "reflection") {
    return status === "GENERATING_DOCUMENT" ? "sending content" : undefined;
  }

  if (source === "reflection" && target === "document") {
    return status === "GENERATING_DOCUMENT" ? "sending report" : undefined;
  }

  return undefined;
}

function buildEdge(
  id: string,
  source: PipelineNodeId,
  target: PipelineNodeId,
  label: string | undefined,
  status: JobStatus,
  sourceState: NodeState,
  targetState: NodeState
): Edge {
  const isLive = sourceState === "active" || targetState === "active" || targetState === "retrying";

  return {
    id,
    source,
    target,
    type: "smoothstep",
    animated: isLive,
    style: {
      stroke:
        targetState === "failed"
          ? "#ef4444"
          : targetState === "completed"
          ? "rgba(34,197,94,0.8)"
          : targetState === "active"
          ? "rgba(59,130,246,0.9)"
          : "rgba(255,255,255,0.18)",
      strokeWidth: isLive ? 3 : 2,
      strokeDasharray: isLive ? "6 6" : undefined,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color:
        targetState === "failed"
          ? "#ef4444"
          : targetState === "completed"
          ? "#22c55e"
          : "rgba(255,255,255,0.24)",
    },
    label,
    labelStyle: {
      fill: "#dbeafe",
      fontSize: 11,
      fontWeight: 600,
    },
    labelBgStyle: {
      fill: "rgba(15, 23, 42, 0.9)",
    },
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 8,
  };
}

function WorkflowGraphImpl({
  status,
  events,
  plan,
  generatedContent,
  currentAgent,
  currentTask,
  currentActivity,
  elapsedTime,
  selectedNodeId,
  onNodeSelect,
  onActiveNodeChange,
}: {
  status: JobStatus;
  events: AgentEvent[];
  plan: PlanStep[];
  generatedContent: GeneratedContent[];
  currentAgent: string | null;
  currentTask: string | null;
  currentActivity: string | null;
  elapsedTime: number;
  selectedNodeId: PipelineNodeId | null;
  onNodeSelect?: (node: WorkflowNodeSnapshot) => void;
  onActiveNodeChange?: (node: WorkflowNodeSnapshot) => void;
}) {
  const [layout, setLayout] = useState<LayoutMode>("horizontal");

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setLayout("vertical");
        return;
      }

      setLayout("horizontal");
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  const retryInfos = useMemo(
    () => ({
      planner: getRetryInfo(events, "planner"),
      executor: getRetryInfo(events, "executor"),
      reflection: getRetryInfo(events, "reflection"),
      document: getRetryInfo(events, "document"),
    }),
    [events]
  );

  const activeNodeId = useMemo(
    () => getActiveNodeId(status, currentAgent, events),
    [status, currentAgent, events]
  );

  const nodeSnapshots = useMemo(
    () =>
      Object.fromEntries(
        BASE_NODE_IDS.map((id) => [
          id,
          buildNodeSnapshot(id, {
            status,
            currentAgent,
            currentTask,
            currentActivity,
            elapsedTime,
            events,
            generatedContent,
            plan,
          }),
        ])
      ) as Record<PipelineNodeId, WorkflowNodeSnapshot>,
    [status, currentAgent, currentTask, currentActivity, elapsedTime, events, generatedContent, plan]
  );

  useEffect(() => {
    if (onActiveNodeChange) {
      onActiveNodeChange(nodeSnapshots[activeNodeId]);
    }
  }, [activeNodeId, nodeSnapshots, onActiveNodeChange]);

  const nodes: Node<AgentNodeData>[] = useMemo(() => {
    const horizontalNodes: Record<PipelineNodeId, { x: number; y: number }> = {
      user: { x: 0, y: 140 },
      planner: { x: 400, y: 140 },
      executor: { x: 800, y: 140 },
      reflection: { x: 1200, y: 140 },
      document: { x: 1600, y: 140 },
      final: { x: 2000, y: 140 },
    };

    const verticalNodes: Record<PipelineNodeId, { x: number; y: number }> = {
      user: { x: 30, y: 0 },
      planner: { x: 30, y: 220 },
      executor: { x: 30, y: 440 },
      reflection: { x: 30, y: 660 },
      document: { x: 30, y: 880 },
      final: { x: 30, y: 1100 },
    };

    const positions = layout === "horizontal" ? horizontalNodes : verticalNodes;

    return BASE_NODE_IDS.map((id) => ({
      id,
      type: "agentNode",
      position: positions[id],
      data: {
        label: NODE_TITLES[id],
        description: NODE_DESCRIPTIONS[id],
        icon: NODE_ICONS[id],
        state: deriveNodeState(id, status, currentAgent, events),
        summary: nodeSnapshots[id].summary,
        activity: nodeSnapshots[id].currentActivity,
        selected: selectedNodeId === id,
        layout,
        inputs: NODE_INPUTS[id],
        outputs: NODE_OUTPUTS[id],
        retryInfo: id === "planner" ? retryInfos.planner : id === "executor" ? retryInfos.executor : id === "reflection" ? retryInfos.reflection : id === "document" ? retryInfos.document : null,
        onSelect: (nodeId: string) => {
          onNodeSelect?.(nodeSnapshots[nodeId as PipelineNodeId]);
        },
      },
    }));
  }, [layout, status, currentAgent, events, nodeSnapshots, selectedNodeId, retryInfos, onNodeSelect]);

  const edges: Edge[] = useMemo(() => {
    const states: Record<PipelineNodeId, NodeState> = {
      user: deriveNodeState("user", status, currentAgent, events),
      planner: deriveNodeState("planner", status, currentAgent, events),
      executor: deriveNodeState("executor", status, currentAgent, events),
      reflection: deriveNodeState("reflection", status, currentAgent, events),
      document: deriveNodeState("document", status, currentAgent, events),
      final: deriveNodeState("final", status, currentAgent, events),
    };

    return [
      buildEdge(
        "user-planner",
        "user",
        "planner",
        status === "CREATED" ? "waiting for input" : undefined,
        status,
        states.user,
        states.planner
      ),
      buildEdge(
        "planner-executor",
        "planner",
        "executor",
        buildEdgeLabel("planner", "executor", status),
        status,
        states.planner,
        states.executor
      ),
      buildEdge(
        "executor-reflection",
        "executor",
        "reflection",
        buildEdgeLabel("executor", "reflection", status),
        status,
        states.executor,
        states.reflection
      ),
      buildEdge(
        "reflection-document",
        "reflection",
        "document",
        buildEdgeLabel("reflection", "document", status),
        status,
        states.reflection,
        states.document
      ),
      buildEdge(
        "document-final",
        "document",
        "final",
        buildEdgeLabel("document", "final", status),
        status,
        states.document,
        states.final
      ),
    ];
  }, [status, currentAgent, events]);

  const canvasStyle = layout === "horizontal" ? { minWidth: 2160, height: "100%" } : { minWidth: 360, minHeight: 1160 };

  return (
    <div className="relative w-full h-full rounded-3xl bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.85),rgba(2,6,23,0.95))]"
      style={layout === "horizontal" ? { overflowX: "auto", overflowY: "hidden" } : { overflow: "auto" }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-50 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.14),transparent_18%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.12),transparent_16%),radial-gradient(circle_at_50%_80%,rgba(34,197,94,0.08),transparent_18%)]" />

      <div className="relative z-10 p-4 md:p-6 h-full" style={layout === "horizontal" ? { ...canvasStyle, minHeight: "100%" } : canvasStyle}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: layout === "horizontal" ? 0.18 : 0.22 }}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable={false}
          panOnScroll={false}
          panOnDrag
          zoomOnScroll
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          style={{ background: "transparent" }}
        >
          <Background color="rgba(255,255,255,0.05)" gap={layout === "horizontal" ? 28 : 24} size={1} />
        </ReactFlow>
      </div>

      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur-xl">
        {layout === "horizontal" ? <ArrowRight className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />}
        Live workflow
      </div>
    </div>
  );
}

export const WorkflowGraph = memo(WorkflowGraphImpl);