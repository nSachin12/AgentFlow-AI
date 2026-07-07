from fastapi import APIRouter, HTTPException

from app.agent.executor import Executor
from app.agent.reflection import Reflection
from app.agent.state_manager import StateManager

from app.services.database_service import DatabaseService
from app.services.document_service import DocumentService

from app.utils.constants import (
    JOB_RUNNING,
    JOB_COMPLETED,
    JOB_GENERATING_DOCUMENT
)
from app.utils.event_manager import EventManager

router = APIRouter(
    prefix="/agent",
    tags=["Agent"]
)


@router.post("/next/{job_id}")
def execute_next_step(job_id: str):

    job = DatabaseService.get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    if job.status == JOB_COMPLETED:
        return {
            "success": True,
            "message": "Job already completed.",
            "data": {
                "job_id": job.id,
                "document_url": job.document_url
            }
        }

    if job.current_step >= len(job.plan):
        return {
            "success": True,
            "message": "All steps already executed.",
            "data": {
                "job_id": job.id,
                "document_url": job.document_url
            }
        }

    # Acquire execution lock — prevents duplicate concurrent execution
    # from multiple browser tabs or rapid retries.
    lock_acquired = DatabaseService.acquire_lock(job_id)

    if not lock_acquired:
        raise HTTPException(
            status_code=409,
            detail="Step is already being executed. Please wait."
        )

    try:
        current_step = job.plan[job.current_step]

        StateManager.set_execution_context(
            job,
            JOB_RUNNING,
            "Executor Agent",
            current_step.title,
            "Researching pricing models..."
        )

        DatabaseService.update_job(job)

        EventManager.add_event(
            job,
            "executor",
            "step_started",
            {
                "step": current_step.step,
                "title": current_step.title
            }
        )

        result = Executor.execute_step(job)

        current_step.output = result
        current_step.status = "completed"

        job.generated_content.append(
            {
                "step": current_step.step,
                "title": current_step.title,
                "output": result
            }
        )

        EventManager.add_event(
            job,
            "executor",
            "step_completed",
            {
                "step": current_step.step,
                "title": current_step.title
            }
        )

        StateManager.increment_step(job)

        finished = job.current_step >= len(job.plan)

        DatabaseService.update_job(job)

        if finished:

            StateManager.set_execution_context(
                job,
                JOB_GENERATING_DOCUMENT,
                "Reflection Agent",
                "Reviewing completed outputs",
                "Reviewing proposal..."
            )
            DatabaseService.update_job(job)

            EventManager.add_event(job, "reflection", "started")

            combined_content = "\n\n".join(
                [item["output"] for item in job.generated_content]
            )

            review = Reflection.review(job, job.request, combined_content)

            EventManager.add_event(job, "reflection", "completed")

            if not review.get("is_complete", True):
                job.generated_content.append(
                    {
                        "step": "reflection",
                        "title": "Reflection Feedback",
                        "output": review.get("feedback", "")
                    }
                )

            StateManager.set_execution_context(
                job,
                JOB_GENERATING_DOCUMENT,
                "Document Generator",
                "Preparing final report",
                "Generating document..."
            )

            EventManager.add_event(job, "document", "generation_started")

            document_url = DocumentService.generate_document(job)

            EventManager.add_event(job, "document", "generated")

            job.document_url = document_url

            EventManager.add_event(
                job,
                "storage",
                "uploaded",
                {"document_url": document_url}
            )

            StateManager.complete_job(job)
            DatabaseService.update_job(job)

            return {
                "success": True,
                "message": "Job completed successfully.",
                "data": {
                    "job_id": job.id,
                    "status": job.status,
                    "document_url": document_url
                }
            }

        return {
            "success": True,
            "message": "Step executed successfully.",
            "data": {
                "job_id": job.id,
                "status": job.status,
                "current_step": job.current_step,
                "total_steps": len(job.plan),
                "remaining_steps": len(job.plan) - job.current_step
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        StateManager.set_error(job, str(e))

        EventManager.add_event(
            job,
            "system",
            "error",
            {"message": str(e)}
        )

        DatabaseService.update_job(job)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        # Always release the lock — even on exception or early return
        DatabaseService.release_lock(job_id)
