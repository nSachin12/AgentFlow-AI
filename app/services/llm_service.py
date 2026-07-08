import os
import time

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


class LLMService:
    def __init__(self):
        self.client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY")
        )

        self.default_temperature = float(
            os.getenv("LLM_TEMPERATURE", "0.7")
        )

        self.default_max_tokens = int(
            os.getenv("LLM_MAX_TOKENS", "800")
        )

        # Kept well under the platform's function duration limit (e.g. Vercel
        # Hobby caps at 300s) — generate() retries up to 3 times, so this timeout
        # times the retry count must comfortably fit in one request lifecycle.
        self.request_timeout = int(
            os.getenv("LLM_REQUEST_TIMEOUT", "25")
        )

    def generate(
        self,
        prompt: str,
        model: str,
        max_tokens: int | None = None,
        temperature: float | None = None,
        retries: int = 3,
        on_retry=None,
        on_usage=None
    ):

        max_tokens = (
            max_tokens
            or self.default_max_tokens
        )

        temperature = (
            temperature
            if temperature is not None
            else self.default_temperature
        )

        for attempt in range(retries):
            try:
                response = (
                    self.client.chat.completions.create(
                        model=model,
                        messages=[
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=False,
                        timeout=self.request_timeout
                    )
                )

                content = (
                    response
                    .choices[0]
                    .message
                    .content
                )

                if content:
                    if on_usage and getattr(response, "usage", None):
                        on_usage(response.usage.total_tokens)

                    return content.strip()

            except Exception as e:
                print(
                    f"LLM Error "
                    f"(Attempt {attempt + 1}/{retries}): {e}"
                )

                if attempt < retries - 1:
                    # Fire before the backoff sleep, and persist immediately on
                    # the caller's side — this is what lets the frontend see a
                    # "retrying" state while this call is still in flight.
                    if on_retry:
                        on_retry(attempt + 2, retries, str(e))

                    # Short backoff — a serverless function pays for every
                    # second of blocking sleep, so don't linger between retries.
                    time.sleep(1)

        raise Exception(
            f"LLM provider timed out or failed after {retries} attempts "
            f"(model: {model}). The upstream model may be unavailable — "
            f"try a different model."
        )


llm_service = LLMService()