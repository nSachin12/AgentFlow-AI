"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { agentApi } from "@/lib/api";
import type { AgentEvent, GeneratedContent, JobStatus, PlanStep } from "@/types";

export interface AgentState {
  status: JobStatus;
  currentAgent: string | null;
  currentTask: string | null;
  currentActivity: string | null;
  startedAt: string | null;
  elapsedTime: number;
  progress: number;
  currentStep: number;
  totalSteps: number;
  assumptions: string[];
  events: AgentEvent[];
  plan: PlanStep[];
  generatedContent: GeneratedContent[];
  documentUrl: string | null;
  tokensUsed: number;
  error: string | null;
  isLoading: boolean;
}

const INITIAL: AgentState = {
  status: "PLANNED",
  currentAgent: null,
  currentTask: null,
  currentActivity: null,
  startedAt: null,
  elapsedTime: 0,
  progress: 0,
  currentStep: 0,
  totalSteps: 0,
  assumptions: [],
  events: [],
  plan: [],
  generatedContent: [],
  documentUrl: null,
  tokensUsed: 0,
  error: null,
  isLoading: true,
};

const TERMINAL: JobStatus[] = ["COMPLETED", "FAILED"];
const STEP_DELAY_MS = 2000;
const LOCK_BACKOFF_MS = 3000;
// Independent of the execution-driving loop below — /agent/next blocks for the
// full duration of an LLM call (including retries), so without this second,
// lightweight poll the UI would only learn about a "retrying" event after that
// call finally returns. Polling status on its own cadence surfaces it live.
const FAST_POLL_MS = 1500;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

function isLockConflict(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err as Error & { isLockConflict?: boolean }).isLockConflict === true
  );
}

export function useAgentExecution(jobId: string) {
  const [state, setState] = useState<AgentState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const startLoop = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setState(INITIAL);

    (async () => {
      while (!signal.aborted) {
        try {
          // 1. Poll current status from backend
          const statusRes = await agentApi.status(jobId);
          if (signal.aborted) return;

          const d = statusRes.data;

          setState((prev) => ({
            ...prev,
            status: d.status,
            currentAgent: d.current_agent,
            currentTask: d.current_task,
            currentActivity: d.current_activity,
            startedAt: d.started_at,
            elapsedTime: d.elapsed_time,
            progress: d.progress,
            currentStep: d.current_step,
            totalSteps: d.total_steps,
            assumptions: d.assumptions,
            events: d.events,
            plan: d.plan,
            generatedContent: d.generated_content,
            documentUrl: d.document_url,
            tokensUsed: d.tokens_used,
            error: d.error,
            // Clear transient errors on successful poll
            isLoading: false,
          }));

          // 2. Terminal — fetch full result then stop
          if (TERMINAL.includes(d.status)) {
            try {
              const resultRes = await agentApi.result(jobId);
              if (signal.aborted) return;
              const r = resultRes.data;
              setState((prev) => ({
                ...prev,
                status: r.status,
                currentAgent: r.current_agent,
                currentTask: r.current_task,
                currentActivity: r.current_activity,
                startedAt: r.started_at,
                elapsedTime: r.elapsed_time,
                plan: r.plan,
                generatedContent: r.generated_content,
                documentUrl: r.document_url,
                tokensUsed: r.tokens_used,
                error: r.error,
                progress: r.status === "COMPLETED" ? 100 : prev.progress,
                isLoading: false,
              }));
            } catch {
              // result fetch failed — status already reflects terminal
            }
            return;
          }

          // 3. Advance agent — sequential, never concurrent
          await agentApi.next(jobId);
          if (signal.aborted) return;

          // 4. Wait before next iteration
          await sleep(STEP_DELAY_MS, signal);
        } catch (err) {
          if (signal.aborted) return;
          if (err instanceof Error && err.name === "AbortError") return;

          // 409 lock conflict — another tab is executing; back off silently
          if (isLockConflict(err)) {
            try {
              await sleep(LOCK_BACKOFF_MS, signal);
            } catch {
              return;
            }
            continue;
          }

          // Surface real errors to the user
          setState((prev) => ({
            ...prev,
            error:
              err instanceof Error
                ? err.message
                : "Network error. Retrying...",
            isLoading: false,
          }));

          // Back-off before retry
          try {
            await sleep(STEP_DELAY_MS * 2, signal);
          } catch {
            return;
          }
        }
      }
    })();
  }, [jobId]);

  useEffect(() => {
    startLoop();
    return () => {
      abortRef.current?.abort();
    };
  }, [startLoop]);

  // Fast, read-only status poll — runs independently of the loop above so
  // events (like "retrying") persisted mid-request are visible while the
  // main loop is still blocked inside an /agent/next call.
  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      try {
        const statusRes = await agentApi.status(jobId);
        if (cancelled) return;

        const d = statusRes.data;
        setState((prev) => ({
          ...prev,
          status: d.status,
          currentAgent: d.current_agent,
          currentTask: d.current_task,
          currentActivity: d.current_activity,
          startedAt: d.started_at,
          elapsedTime: d.elapsed_time,
          progress: d.progress,
          currentStep: d.current_step,
          totalSteps: d.total_steps,
          assumptions: d.assumptions,
          events: d.events,
          plan: d.plan,
          generatedContent: d.generated_content,
          documentUrl: d.document_url,
          error: d.error,
        }));

        if (TERMINAL.includes(d.status) && intervalId) {
          clearInterval(intervalId);
        }
      } catch {
        // Best-effort — the main loop above is responsible for surfacing real errors.
      }
    };

    intervalId = setInterval(poll, FAST_POLL_MS);
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId]);

  const retry = useCallback(() => {
    startLoop();
  }, [startLoop]);

  return { state, retry };
}
