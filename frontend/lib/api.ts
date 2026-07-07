import axios, { AxiosError } from "axios";
import type { StartResponse, StatusResponse, ResultResponse } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  // LLM calls can take up to 90s on the backend — give enough headroom.
  timeout: 60_000,
});

// Map HTTP errors to user-friendly messages before they reach the UI.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.code === "ECONNABORTED" || error.code === "ERR_CANCELED") {
      return Promise.reject(
        new Error("Request timed out. The agent is taking longer than expected — retrying...")
      );
    }

    if (!error.response) {
      return Promise.reject(
        new Error("Cannot reach the backend. Check your network connection.")
      );
    }

    const status = error.response.status;
    const detail =
      (error.response.data as { detail?: string })?.detail ?? "";

    if (status === 409) {
      // Execution lock held — not a real error, caller should back off
      return Promise.reject(
        Object.assign(new Error("Step already executing. Waiting..."), {
          isLockConflict: true,
        })
      );
    }

    if (status === 404) {
      return Promise.reject(new Error("Job not found. It may have expired."));
    }

    if (status >= 500) {
      return Promise.reject(
        new Error(detail || "The agent encountered an internal error.")
      );
    }

    return Promise.reject(new Error(detail || `Unexpected error (${status})`));
  }
);

export const agentApi = {
  start: (request: string) =>
    api.post<StartResponse>("/agent/start", { request }).then((r) => r.data),

  next: (jobId: string) =>
    api.post(`/agent/next/${jobId}`).then((r) => r.data),

  status: (jobId: string) =>
    api.get<StatusResponse>(`/agent/status/${jobId}`).then((r) => r.data),

  result: (jobId: string) =>
    api.get<ResultResponse>(`/agent/result/${jobId}`).then((r) => r.data),
};
