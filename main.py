import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.start import router as start_router
from app.api.next import router as next_router
from app.api.result import router as result_router
from app.api.status import router as status_router

load_dotenv()

app = FastAPI(
    title="Autonomous AI Agent",
    version="1.0.0"
)

# Parse comma-separated origins from env — never hardcode frontend URLs.
# Example: ALLOWED_ORIGINS=http://localhost:3000,https://myfrontend.vercel.app
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(start_router)
app.include_router(next_router)
app.include_router(result_router)
app.include_router(status_router)


@app.get("/")
def health_check():
    return {
        "status": "running",
        "message": "Autonomous AI Agent API"
    }
