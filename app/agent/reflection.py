import os

from app.services.llm_service import llm_service
from app.services.database_service import DatabaseService
from app.utils.event_manager import EventManager
from app.utils.helpers import extract_json


class Reflection:

    @staticmethod
    def build_summary(job, request: str) -> str:
        lines = [f"Request: {request}"]

        if job.assumptions:
            lines.append("Assumptions: " + "; ".join(job.assumptions[:5]))

        lines.append("Plan steps: " + ", ".join(
            step.title for step in job.plan
        ))

        for item in job.generated_content:
            snippet = (item.get("output") or "")[:300].replace("\n", " ")
            lines.append(f"- {item['title']}: {snippet}")

        return "\n".join(lines)

    @staticmethod
    def review(job, request: str):

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

        summary = Reflection.build_summary(job, request)

        with open(
            "app/prompts/reflection_prompt.txt",
            "r",
            encoding="utf-8"
        ) as file:
            prompt = file.read()

        prompt = prompt.replace("{request}", request)
        prompt = prompt.replace("{content}", summary)

        response = llm_service.generate(
            prompt,
            os.getenv("REFLECTION_MODEL"),
            on_retry=on_retry,
            on_usage=on_usage
        )

        return extract_json(response)