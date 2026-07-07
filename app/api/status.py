from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    HTTPException
)

from app.services.database_service import (
    DatabaseService
)

router = APIRouter(
    prefix="/agent",
    tags=["Agent"]
)


@router.get("/status/{job_id}")
def get_status(
    job_id: str
):

    job = (
        DatabaseService
        .get_job(job_id)
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    started_at = job.started_at.isoformat() if job.started_at else None
    elapsed_time = 0
    if job.started_at:
        now = datetime.now(timezone.utc)
        started = job.started_at if job.started_at.tzinfo else job.started_at.replace(tzinfo=timezone.utc)
        elapsed_time = int((now - started).total_seconds())

    progress = int(
        (
            job.current_step
            /
            max(
                len(job.plan),
                1
            )
        )
        * 100
    )

    return {
        "success": True,
        "data": {
            "job_id":
            job.id,

            "status":
            job.status,

            "current_agent":
            job.current_agent,

            "current_task":
            job.current_task,

            "current_activity":
            job.current_activity,

            "started_at":
            started_at,

            "elapsed_time":
            elapsed_time,

            "progress":
            progress,

            "current_step":
            job.current_step,

            "total_steps":
            len(job.plan),

            "assumptions":
            job.assumptions,

            "plan": [
                step.model_dump()
                for step in job.plan
            ],

            "generated_content":
            job.generated_content,

            "document_url":
            job.document_url,

            "tokens_used":
            job.tokens_used,

            "error":
            job.error,

            "events":
            job.events
        }
    }