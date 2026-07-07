import os

from app.services.llm_service import llm_service
from app.services.database_service import DatabaseService
from app.utils.event_manager import EventManager
from app.utils.helpers import extract_json


class Reflection:

    @staticmethod
    def review(
        job,
        request: str,
        content: str
    ):

        def on_retry(attempt, max_retries, error):
            EventManager.add_event(
                job,
                "reflection",
                "retrying",
                {"attempt": attempt, "max_retries": max_retries}
            )
            DatabaseService.update_job(job)

        def on_usage(tokens):
            job.tokens_used += tokens

        with open(
            "app/prompts/reflection_prompt.txt",
            "r",
            encoding="utf-8"
        ) as file:
            prompt = file.read()

        prompt = prompt.replace(
            "{request}",
            request
        )

        prompt = prompt.replace(
            "{content}",
            content
        )

        response = llm_service.generate(
            prompt,
            os.getenv("REFLECTION_MODEL"),
            on_retry=on_retry,
            on_usage=on_usage
        )

        return extract_json(response)