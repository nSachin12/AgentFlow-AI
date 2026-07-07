from pydantic import BaseModel


class PlanStep(BaseModel):
    step: int
    title: str
    status: str = "pending"
    output: str = ""