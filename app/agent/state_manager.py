from datetime import datetime

from app.models.job import Job
from app.utils.constants import (
    JOB_COMPLETED,
    JOB_FAILED,
)


class StateManager:

    @staticmethod
    def set_execution_context(
        job: Job,
        status: str,
        current_agent: str,
        current_task: str,
        current_activity: str,
    ):
        if job.started_at is None:
            job.started_at = datetime.utcnow()

        job.status = status
        job.current_agent = current_agent
        job.current_task = current_task
        job.current_activity = current_activity
        job.updated_at = datetime.utcnow()
        return job

    @staticmethod
    def update_status(job: Job, status: str):
        job.status = status
        job.updated_at = datetime.utcnow()
        return job

    @staticmethod
    def increment_step(job: Job):
        job.current_step += 1
        job.updated_at = datetime.utcnow()
        return job

    @staticmethod
    def set_error(job: Job, error: str):
        job.status = JOB_FAILED
        job.error = error
        job.updated_at = datetime.utcnow()
        return job

    @staticmethod
    def complete_job(job: Job):
        job.status = JOB_COMPLETED
        job.current_activity = "Final report ready."
        job.updated_at = datetime.utcnow()
        return job