import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${String(remaining).padStart(2, "0")}s`;
}

export function getEventLabel(event: string): string {
  const labels: Record<string, string> = {
    plan_generated: "Planner Generated Plan",
    executor_started: "Executor Started Step",
    executor_completed: "Executor Completed Step",
    reflection_started: "Reflection Started",
    reflection_completed: "Reflection Completed",
    document_generated: "Document Generated",
    storage_uploaded: "Storage Uploaded",
    step_started: "Executor Started Step",
    step_completed: "Executor Completed Step",
    retrying: "Retrying LLM Call",
  };
  return labels[event] ?? event.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
