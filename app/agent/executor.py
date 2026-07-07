import os

from app.models.job import Job
from app.services.llm_service import llm_service
from app.services.database_service import DatabaseService
from app.utils.event_manager import EventManager


class Executor:

    @staticmethod
    def execute_step(job: Job):

        def on_retry(attempt, max_retries, error):
            EventManager.add_event(
                job,
                "executor",
                "retrying",
                {"attempt": attempt, "max_retries": max_retries}
            )
            DatabaseService.update_job(job)

        def on_usage(tokens):
            job.tokens_used += tokens

        current = job.plan[
            job.current_step
        ]

        previous_outputs = ""

        if job.generated_content:

            recent_steps = (
                job.generated_content[-2:]
            )

            for item in recent_steps:

                output = item[
                    "output"
                ][:500]

                previous_outputs += (
                    f"Step {item['step']}"
                    f" ({item['title']}):\n"
                    f"{output}\n\n"
                )

        with open(
            "app/prompts/executor_prompt.txt",
            "r",
            encoding="utf-8"
        ) as file:
            prompt = file.read()

        prompt = prompt.replace(
            "{request}",
            job.request
        )

        prompt = prompt.replace(
            "{previous_outputs}",
            previous_outputs
            or "None"
        )

        prompt = prompt.replace(
            "{current_task}",
            current.title
        )

        result = llm_service.generate(
            prompt=prompt,
            model=os.getenv(
                "EXECUTOR_MODEL"
            ),
            max_tokens=int(
                os.getenv(
                    "EXECUTOR_MAX_TOKENS",
                    "500"
                )
            ),
            temperature=0.5,
            on_retry=on_retry,
            on_usage=on_usage
        )

        return result