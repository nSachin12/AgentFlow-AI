import json
import re


def extract_json(text: str):
    """
    Extract JSON from LLM responses.
    Handles:
    - Pure JSON
    - ```json ... ```
    - ``` ... ```
    """

    text = text.strip()

    text = re.sub(
        r"^```json",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"^```",
        "",
        text
    )

    text = re.sub(
        r"```$",
        "",
        text
    )

    text = text.strip()

    return json.loads(text)