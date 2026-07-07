from fastapi import (
    APIRouter,
    HTTPException
)

from app.agent.planner import Planner
from app.agent.state_manager import StateManager
from app.models.job import Job
from app.models.request import AgentRequest
from app.services.database_service import (
    DatabaseService
)
from app.utils.constants import (
    JOB_CREATED,
    JOB_FAILED,
    JOB_PLANNED
)
from app.utils.event_manager import (
    EventManager
)

router = APIRouter(
    prefix="/agent",
    tags=["Agent"]
)


@router.post("/start")
def start_agent(
    request: AgentRequest
):
    # Created up front (before planning) so retry events during Planner.create_plan
    # have a real job row to attach to — see app/agent/planner.py's on_retry.
    job = Job(
        request=request.request,
        status=JOB_CREATED
    )

    StateManager.set_execution_context(
        job,
        JOB_CREATED,
        "Planner Agent",
        request.request,
        "Creating execution plan..."
    )

    DatabaseService.create_job(
        job
    )

    try:

        plan, assumptions = (
            Planner.create_plan(
                job,
                request.request
            )
        )

        job.plan = plan
        job.assumptions = assumptions
        job.status = JOB_PLANNED
        job.current_agent = "Planner Agent"
        job.current_task = request.request
        job.current_activity = "Execution plan generated."

        EventManager.add_event(
            job,
            "planner",
            "plan_generated",
            {
                "steps":
                len(job.plan)
            }
        )

        DatabaseService.update_job(
            job
        )

        return {
            "success": True,
            "message":
            "Plan generated successfully.",
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
                job.started_at.isoformat() if job.started_at else None,

                "elapsed_time":
                0,

                "assumptions":
                job.assumptions,

                "plan": [
                    step.model_dump()
                    for step in job.plan
                ]
            }
        }

    except Exception as e:
        job.status = JOB_FAILED
        job.error = str(e)
        DatabaseService.update_job(job)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )