from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.database import sync_engine
from app.models import Base
from app.routers import ohlcv, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup tables on startup using sync engine for simplicity
    Base.metadata.create_all(bind=sync_engine)
    yield
    # Teardown logic if any

app = FastAPI(title="OHLCV Candle Service", lifespan=lifespan)

app.include_router(health.router)
app.include_router(ohlcv.router)
