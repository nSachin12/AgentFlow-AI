from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field

from app.models.plan import PlanStep


class Job(BaseModel):
    id: str = Field(
        default_factory=lambda: str(uuid4())
    )

    request: str

    status: str = "CREATED"

    current_agent: Optional[str] = None

    current_task: Optional[str] = None

    current_activity: Optional[str] = None

    started_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    plan: List[PlanStep] = Field(
        default_factory=list
    )

    current_step: int = 0

    generated_content: list = Field(
        default_factory=list
    )

    assumptions: list = Field(
        default_factory=list
    )

    events: list = Field(
        default_factory=list
    )

    document_url: Optional[str] = None

    tokens_used: int = 0

    error: Optional[str] = None

    # Execution lock — prevents two concurrent /next calls from
    # executing the same step when multiple browser tabs are open.
    is_executing: bool = False

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
