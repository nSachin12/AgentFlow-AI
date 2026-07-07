import os

from supabase import create_client, Client
from dotenv import load_dotenv

from app.models.job import Job
from app.models.plan import PlanStep

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class DatabaseService:

    @staticmethod
    def create_job(job: Job):
        data = job.model_dump(mode="json")
        supabase.table("jobs").insert(data).execute()
        return job

    @staticmethod
    def get_job(job_id: str):
        response = (
            supabase.table("jobs")
            .select("*")
            .eq("id", job_id)
            .single()
            .execute()
        )

        if not response.data:
            return None

        data = response.data
        data["plan"] = [
            PlanStep(**step)
            for step in data.get("plan", [])
        ]

        return Job(**data)

    @staticmethod
    def update_job(job: Job):
        data = job.model_dump(mode="json")
        supabase.table("jobs").update(data).eq("id", job.id).execute()
        return job

    @staticmethod
    def acquire_lock(job_id: str) -> bool:
        """
        Atomically set is_executing = True only when it is currently False.
        Returns True if the lock was acquired, False if another process holds it.

        Supabase does not expose SELECT FOR UPDATE, so we use a conditional
        update: update WHERE is_executing = false and check affected rows.
        """
        response = (
            supabase.table("jobs")
            .update({"is_executing": True})
            .eq("id", job_id)
            .eq("is_executing", False)
            .execute()
        )
        # If no rows were updated, the lock was already held
        return bool(response.data)

    @staticmethod
    def release_lock(job_id: str):
        """Unconditionally release the execution lock."""
        supabase.table("jobs").update(
            {"is_executing": False}
        ).eq("id", job_id).execute()
