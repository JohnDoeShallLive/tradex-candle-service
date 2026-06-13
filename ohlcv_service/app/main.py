from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(ohlcv.router)

import os
ui_dir = os.path.join(os.path.dirname(__file__), "..", "ui")
if os.path.exists(ui_dir):
    app.mount("/", StaticFiles(directory=ui_dir, html=True), name="ui")
