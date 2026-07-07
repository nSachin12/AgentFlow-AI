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


@router.get("/result/{job_id}")
def get_result(
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

    return {
        "success": True,
        "data": {
            "job_id":
            job.id,

            "status":
            job.status,

            "current_step":
            job.current_step,

            "current_agent":
            job.current_agent,

            "current_task":
            job.current_task,

            "current_activity":
            job.current_activity,

            "started_at":
            job.started_at.isoformat() if job.started_at else None,

            "elapsed_time":
            int((datetime.now(timezone.utc) - (job.started_at if job.started_at.tzinfo else job.started_at.replace(tzinfo=timezone.utc))).total_seconds()) if job.started_at else 0,

            "total_steps":
            len(job.plan),

            "document_url":
            job.document_url,

            "assumptions":
            job.assumptions,

            "events":
            job.events,

            "plan": [
                step.model_dump()
                for step in job.plan
            ],

            "generated_content":
            job.generated_content,

            "tokens_used":
            job.tokens_used,

            "error":
            job.error
        }
    }