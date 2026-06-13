from pydantic import BaseModel, ConfigDict
from decimal import Decimal

class CandleResponse(BaseModel):
    bucket: str
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int

    model_config = ConfigDict(from_attributes=True)

class HealthResponse(BaseModel):
    status: str
    database: str
