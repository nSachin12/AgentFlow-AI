export type JobStatus =
  | "CREATED"
  | "PLANNED"
  | "RUNNING"
  | "GENERATING_DOCUMENT"
  | "COMPLETED"
  | "FAILED";

export type StepStatus = "pending" | "completed" | "failed";

export interface PlanStep {
  step: number;
  title: string;
  status: StepStatus;
  output: string;
}

export interface AgentEvent {
  timestamp: string;
  agent: string;
  event: string;
  metadata: Record<string, unknown>;
}

export interface GeneratedContent {
  title: string;
  content?: string;
  output?: string;
  step?: number | string;
}

export interface WorkflowNodeSnapshot {
  id: string;
  label: string;
  description: string;
  state: "active" | "completed" | "pending" | "failed" | "retrying";
  summary: string;
  currentActivity: string;
  inputs: string[];
  outputs: string[];
  executionTime: string;
}

export interface StartResponse {
  success: boolean;
  message: string;
  data: {
    job_id: string;
    status: JobStatus;
    assumptions: string[];
    plan: PlanStep[];
  };
}

export interface StatusResponse {
  success: boolean;
  data: {
    job_id: string;
    status: JobStatus;
    current_agent: string | null;
    current_task: string | null;
    current_activity: string | null;
    started_at: string | null;
    elapsed_time: number;
    progress: number;
    current_step: number;
    total_steps: number;
    assumptions: string[];
    plan: PlanStep[];
    generated_content: GeneratedContent[];
    document_url: string | null;
    tokens_used: number;
    error: string | null;
    events: AgentEvent[];
  };
}

export interface ResultResponse {
  success: boolean;
  data: {
    job_id: string;
    status: JobStatus;
    current_agent: string | null;
    current_task: string | null;
    current_activity: string | null;
    started_at: string | null;
    elapsed_time: number;
    current_step: number;
    total_steps: number;
    document_url: string | null;
    assumptions: string[];
    events: AgentEvent[];
    plan: PlanStep[];
    generated_content: GeneratedContent[];
    tokens_used: number;
    error: string | null;
  };
}
