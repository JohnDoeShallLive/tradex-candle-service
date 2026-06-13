from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List
from datetime import datetime

from app.database import get_db
from app.schemas import CandleResponse
from app.queries import get_candle_query

router = APIRouter(prefix="/ohlcv", tags=["OHLCV"])

async def check_instrument_exists(session: AsyncSession, instrument_token: int) -> bool:
    res = await session.execute(
        text("SELECT 1 FROM ticks WHERE instrument_token = :token LIMIT 1"),
        {"token": instrument_token}
    )
    return res.scalar() is not None

@router.get("/1min", response_model=List[CandleResponse])
async def get_1min(
    instrument_token: int = Query(..., description="Instrument token"),
    from_ts: datetime = Query(..., alias="from", description="From datetime (inclusive)"),
    to_ts: datetime = Query(..., alias="to", description="To datetime (exclusive)"),
    session: AsyncSession = Depends(get_db)
):
    if from_ts >= to_ts:
        raise HTTPException(status_code=422, detail="from must be strictly before to")

    exists = await check_instrument_exists(session, instrument_token)
    if not exists:
        raise HTTPException(status_code=404, detail="Instrument not found")

    query = get_candle_query("1min")
    res = await session.execute(
        text(query),
        {"instrument_token": instrument_token, "from_ts": from_ts, "to_ts": to_ts}
    )
    rows = res.fetchall()
    
    return [
        {
            "bucket": row.bucket.isoformat().replace('+00:00', '').replace('Z', ''),
            "open": row.open,
            "high": row.high,
            "low": row.low,
            "close": row.close,
            "volume": int(row.volume)
        } for row in rows
    ]

@router.get("/daily", response_model=List[CandleResponse])
async def get_daily(
    instrument_token: int = Query(..., description="Instrument token"),
    from_ts: datetime = Query(..., alias="from", description="From datetime (inclusive)"),
    to_ts: datetime = Query(..., alias="to", description="To datetime (exclusive)"),
    session: AsyncSession = Depends(get_db)
):
    if from_ts >= to_ts:
        raise HTTPException(status_code=422, detail="from must be strictly before to")

    exists = await check_instrument_exists(session, instrument_token)
    if not exists:
        raise HTTPException(status_code=404, detail="Instrument not found")

    query = get_candle_query("daily")
    res = await session.execute(
        text(query),
        {"instrument_token": instrument_token, "from_ts": from_ts, "to_ts": to_ts}
    )
    rows = res.fetchall()

    return [
        {
            "bucket": row.bucket.strftime("%Y-%m-%d"),
            "open": row.open,
            "high": row.high,
            "low": row.low,
            "close": row.close,
            "volume": int(row.volume)
        } for row in rows
    ]
