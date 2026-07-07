from pydantic import BaseModel, Field


class AgentRequest(BaseModel):
    request: str = Field(
        ...,
        min_length=5,
        description="Natural language request from the user"
    )