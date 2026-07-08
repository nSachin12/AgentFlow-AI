import os

from app.models.plan import PlanStep
from app.services.llm_service import llm_service
from app.services.database_service import DatabaseService
from app.utils.event_manager import EventManager
from app.utils.helpers import extract_json


class Planner:

    @staticmethod
    def create_plan(job, request: str):

        def on_retry(attempt, max_retries, error):
            EventManager.add_event(
                job,
                "planner",
                "retrying",
                {"attempt": attempt, "max_retries": max_retries}
            )
            DatabaseService.update_job(job)

        def on_usage(tokens):
            job.tokens_used += tokens

        with open(
            "app/prompts/planner_prompt.txt",
            "r",
            encoding="utf-8"
        ) as file:
            prompt = file.read()

        prompt = prompt.replace(
            "{request}",
            request
        )

        response = llm_service.generate(
            prompt=prompt,
            model=os.getenv(
                "PLANNER_MODEL"
            ),
            max_tokens=1000,
            on_retry=on_retry,
            on_usage=on_usage
        )

        data = extract_json(
            response
        )

        assumptions = data.get(
            "assumptions",
            []
        )

        steps = data.get(
            "steps",
            []
        )

        plan = []

        for index, step in enumerate(
            steps
        ):
            if isinstance(step, dict):
                title = step.get("title") or step.get("step") or str(step)
            else:
                title = str(step)
            plan.append(
                PlanStep(
                    step=index + 1,
                    title=title
                )
            )

        return plan, assumptions