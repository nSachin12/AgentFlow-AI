# Autonomous AI Agent

An AI-powered tool that takes a plain English request and automatically researches, writes, and delivers a complete professional document — no manual steps required.

---

## What It Does

You type a request like:

> *"Create a business proposal for an AI travel company in Hyderabad with budget estimates and risks."*

The system handles everything autonomously:

1. **Plans** — A Planner Agent breaks the request into 3–8 executable steps and lists its assumptions
2. **Executes** — An Executor Agent runs each step sequentially, producing professional written content per step
3. **Reflects** — A Reflection Agent reviews all outputs and verifies the original request was fully addressed
4. **Documents** — A Document Generator assembles everything into a `.docx` Word file
5. **Delivers** — The document is uploaded to cloud storage and a public download link is returned instantly

The entire pipeline is visible in real time through a live workflow graph — each agent node lights up, shows its current activity, and transitions to completed as the job progresses.

---

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — REST API framework
- [Google Gemini](https://ai.google.dev/) (`gemini-2.5-flash-lite`) — LLM for all three agents, accessed via the OpenAI-compatible endpoint
- [python-docx](https://python-docx.readthedocs.io/) — Word document generation
- [Supabase](https://supabase.com/) — PostgreSQL database (job state) + Storage (document uploads)
- [python-dotenv](https://pypi.org/project/python-dotenv/) — environment variable management

**Frontend**
- [Next.js 16](https://nextjs.org/) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Framer Motion](https://www.framer.com/motion/) — animations
- [ReactFlow](https://reactflow.dev/) — live agent pipeline graph
- [Lucide React](https://lucide.dev/) — icons

---

## Project Structure

```
autonomous-agent/
├── main.py                        # FastAPI app entry point, CORS config, router registration
├── requirements.txt               # Python dependencies
├── vercel.json                    # Backend Vercel deployment config
├── .env                           # Local environment variables (not committed)
├── .env.example                   # Environment variable template
│
├── app/
│   ├── agent/
│   │   ├── planner.py             # Calls LLM to generate a structured execution plan
│   │   ├── executor.py            # Calls LLM to execute a single plan step
│   │   ├── reflection.py          # Calls LLM to review and validate all outputs
│   │   └── state_manager.py       # Manages job status transitions and timestamps
│   │
│   ├── api/
│   │   ├── start.py               # POST /agent/start — creates job, runs planner
│   │   ├── next.py                # POST /agent/next/{job_id} — executes one step
│   │   ├── status.py              # GET  /agent/status/{job_id} — live job state
│   │   └── result.py              # GET  /agent/result/{job_id} — final result + doc URL
│   │
│   ├── models/
│   │   ├── job.py                 # Job Pydantic model (all fields persisted to Supabase)
│   │   ├── plan.py                # PlanStep model
│   │   └── request.py             # AgentRequest input model
│   │
│   ├── prompts/
│   │   ├── planner_prompt.txt     # System prompt — returns JSON plan + assumptions
│   │   ├── executor_prompt.txt    # System prompt — writes content for one step
│   │   └── reflection_prompt.txt  # System prompt — returns JSON is_complete + feedback
│   │
│   ├── services/
│   │   ├── llm_service.py         # Gemini API client with retry logic and token tracking
│   │   ├── database_service.py    # Supabase CRUD operations + execution lock (is_executing)
│   │   ├── document_service.py    # Builds .docx from job content, calls StorageService
│   │   └── storage_service.py     # Uploads .docx to Supabase Storage, returns public URL
│   │
│   └── utils/
│       ├── constants.py           # Job status and step status string constants
│       ├── event_manager.py       # Appends timestamped events to job.events[]
│       └── helpers.py             # Extracts JSON from raw LLM text responses
│
└── frontend/
    ├── app/
    │   ├── page.tsx               # Home page — prompt input
    │   ├── agent/[jobId]/         # Live execution view for a running job
    │   ├── runs/                  # Past runs list
    │   ├── documents/             # Generated documents list
    │   └── settings/              # Settings page
    │
    ├── components/
    │   ├── agent/
    │   │   ├── WorkflowGraph.tsx      # ReactFlow pipeline — 6 agent nodes, live state
    │   │   ├── LiveExecutionPanel.tsx # Current agent, task, activity, elapsed time
    │   │   ├── ProgressPanel.tsx      # Plan steps + assumptions accordion
    │   │   ├── ExecutionStats.tsx     # Token count, step progress, elapsed time
    │   │   ├── ResultSection.tsx      # Generated content accordion + download button
    │   │   └── Timeline.tsx           # Slide-out event log drawer
    │   ├── layout/
    │   │   └── Sidebar.tsx            # Navigation sidebar
    │   └── ui/
    │       ├── PromptForm.tsx         # Home page textarea + submit button
    │       ├── GlassCard.tsx          # Reusable glassmorphism card
    │       ├── StatusBadge.tsx        # Coloured job status pill
    │       └── ThinkingDots.tsx       # Animated thinking indicator
    │
    ├── hooks/
    │   └── useAgentExecution.ts   # Core execution loop — polls status, drives /next calls
    │
    ├── lib/
    │   └── api.ts                 # Typed API client for all four backend endpoints
    │
    └── types/
        └── index.ts               # Shared TypeScript interfaces (Job, Plan, Events, etc.)
```

---

## How It Works

The frontend drives execution — there are no background workers or queues.

1. `POST /agent/start` creates the job row in Supabase and runs the Planner Agent to generate a plan
2. The `useAgentExecution` hook enters a loop:
   - Calls `GET /agent/status` to sync current state to the UI
   - Calls `POST /agent/next` which blocks until the LLM finishes one step
   - Waits 2 seconds, then repeats until the job reaches `COMPLETED` or `FAILED`
3. A second independent interval polls `GET /agent/status` every 1.5 seconds to surface live events (e.g. retry states) while the main loop is blocked inside a `/next` call
4. Once all steps are done, `/next` automatically triggers the Reflection Agent, then the Document Generator, then uploads the file and marks the job `COMPLETED`

An **execution lock** (`is_executing` column in Supabase) prevents two browser tabs from running the same step concurrently. A 409 conflict causes the frontend to back off for 3 seconds and retry silently.

The LLM service retries each call up to **3 times** with a 1-second backoff. Each retry fires a `retrying` event that is persisted immediately and surfaced live on the agent node in the workflow graph.

---

## Job Status Flow

```
CREATED → PLANNED → RUNNING → GENERATING_DOCUMENT → COMPLETED
                                                   ↘ FAILED
```

| Status | Description |
|---|---|
| `CREATED` | Job row inserted, plan not yet generated |
| `PLANNED` | Plan generated, ready to execute |
| `RUNNING` | Executor is working through steps one by one |
| `GENERATING_DOCUMENT` | All steps done — reflection + doc generation in progress |
| `COMPLETED` | Document uploaded, download link available |
| `FAILED` | Unrecoverable error — retry is available from the UI |

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- A free [Supabase](https://supabase.com) account
- A free [Gemini API key](https://aistudio.google.com/apikey)

---

## Supabase Setup

### 1. Create the jobs table

Run this in the Supabase SQL Editor:

```sql
CREATE TABLE jobs (
  id text PRIMARY KEY,
  request text,
  status text DEFAULT 'CREATED',
  current_agent text,
  current_task text,
  current_activity text,
  started_at timestamptz,
  plan jsonb DEFAULT '[]',
  current_step int DEFAULT 0,
  generated_content jsonb DEFAULT '[]',
  assumptions jsonb DEFAULT '[]',
  events jsonb DEFAULT '[]',
  document_url text,
  tokens_used int DEFAULT 0,
  error text,
  is_executing bool DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2. Create the storage bucket

Go to **Storage** → create a bucket named `documents` → set it to **Public**.

---

## Environment Variables

### Backend — `.env`

Copy `.env.example` to `.env` and fill in:

```env
# Groq — https://console.groq.com
GROQ_API_KEY=

# Models
PLANNER_MODEL=llama-3.1-8b-instant
EXECUTOR_MODEL=llama-3.1-8b-instant
REFLECTION_MODEL=llama-3.1-8b-instant

# LLM settings
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=800
EXECUTOR_MAX_TOKENS=500
LLM_REQUEST_TIMEOUT=25

# Supabase
SUPABASE_URL=
SUPABASE_KEY=

# CORS — comma-separated list of allowed frontend origins
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Running Locally

### Backend

```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**, type your request, and hit **Generate Plan**.

---

## Deployment

Both the backend and frontend are configured for [Vercel](https://vercel.com).

### Backend

The root `vercel.json` points Vercel at `main.py` using `@vercel/python` with a 300-second function timeout. Set all `.env` variables as Vercel environment variables before deploying.

> Vercel Hobby plan caps function duration at 10 seconds — upgrade to Pro for the 300-second limit required for LLM calls.

### Frontend

The `frontend/vercel.json` sets the framework to `nextjs`. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL before deploying.
