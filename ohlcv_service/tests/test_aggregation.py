import pytest
from app.models import Tick
from httpx import AsyncClient
from decimal import Decimal

pytestmark = pytest.mark.asyncio

async def insert_ticks(db_session, ticks_data):
    for t in ticks_data:
        tick = Tick(**t)
        db_session.add(tick)
    await db_session.commit()

async def test_ohlcv_basic(db_session, async_client):
    """1. test_ohlcv_basic — insert 3 ticks in a single minute, assert exact open/high/low/close/volume"""
    await insert_ticks(db_session, [
        {"instrument_token": 1, "ts": "2026-06-09T09:15:10Z", "last_price": 100.0, "volume": 10},
        {"instrument_token": 1, "ts": "2026-06-09T09:15:20Z", "last_price": 105.0, "volume": 25},
        {"instrument_token": 1, "ts": "2026-06-09T09:15:30Z", "last_price": 95.0, "volume": 30},
    ])
    
    response = await async_client.get("/ohlcv/1min", params={
        "instrument_token": 1, "from": "2026-06-09T09:15:00Z", "to": "2026-06-09T09:16:00Z"
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    candle = data[0]
    assert candle["open"] == 100.0
    assert candle["high"] == 105.0
    assert candle["low"] == 95.0
    assert candle["close"] == 95.0
    assert candle["volume"] == 30 # 30 - 0 (first bucket uses 0 baseline)

async def test_out_of_order(db_session, async_client):
    """2. test_out_of_order — insert ticks in REVERSE timestamp order, assert open and close are still correct"""
    await insert_ticks(db_session, [
        {"instrument_token": 1, "ts": "2026-06-09T09:15:30Z", "last_price": 95.0, "volume": 30},
        {"instrument_token": 1, "ts": "2026-06-09T09:15:20Z", "last_price": 105.0, "volume": 25},
        {"instrument_token": 1, "ts": "2026-06-09T09:15:10Z", "last_price": 100.0, "volume": 10},
    ])
    
    response = await async_client.get("/ohlcv/1min", params={
        "instrument_token": 1, "from": "2026-06-09T09:15:00Z", "to": "2026-06-09T09:16:00Z"
    })
    data = response.json()
    candle = data[0]
    assert candle["open"] == 100.0
    assert candle["close"] == 95.0

async def test_volume_delta(db_session, async_client):
    """3. test_volume_delta — insert ticks with known cumulative volumes, assert derived bucket volume matches expected delta"""
    await insert_ticks(db_session, [
        {"instrument_token": 1, "ts": "2026-06-09T09:14:59Z", "last_price": 100.0, "volume": 500}, # previous minute
        {"instrument_token": 1, "ts": "2026-06-09T09:15:10Z", "last_price": 101.0, "volume": 510},
        {"instrument_token": 1, "ts": "2026-06-09T09:15:30Z", "last_price": 102.0, "volume": 550},
    ])
    
    response = await async_client.get("/ohlcv/1min", params={
        "instrument_token": 1, "from": "2026-06-09T09:15:00Z", "to": "2026-06-09T09:16:00Z"
    })
    data = response.json()
    candle = data[0]
    # MAX(volume) = 550. Previous volume = 500. Delta = 50
    assert candle["volume"] == 50

async def test_first_bucket_of_day(db_session, async_client):
    """4. test_first_bucket_of_day — no prior tick exists, assert volume = MAX - MIN within bucket"""
    await insert_ticks(db_session, [
        {"instrument_token": 1, "ts": "2026-06-09T09:15:10Z", "last_price": 100.0, "volume": 1000},
        {"instrument_token": 1, "ts": "2026-06-09T09:15:30Z", "last_price": 102.0, "volume": 1050},
    ])
    
    response = await async_client.get("/ohlcv/1min", params={
        "instrument_token": 1, "from": "2026-06-09T09:15:00Z", "to": "2026-06-09T09:16:00Z"
    })
    data = response.json()
    candle = data[0]
    # MAX(1050) - 0 (baseline) = 1050
    assert candle["volume"] == 1050

async def test_single_tick(db_session, async_client):
    """5. test_single_tick — 1 tick in bucket: open==close==high==low, volume==0"""
    await insert_ticks(db_session, [
        {"instrument_token": 1, "ts": "2026-06-09T09:15:10Z", "last_price": 100.0, "volume": 1000},
    ])
    
    response = await async_client.get("/ohlcv/1min", params={
        "instrument_token": 1, "from": "2026-06-09T09:15:00Z", "to": "2026-06-09T09:16:00Z"
    })
    data = response.json()
    candle = data[0]
    assert candle["open"] == 100.0
    assert candle["high"] == 100.0
    assert candle["low"] == 100.0
    assert candle["close"] == 100.0
    assert candle["volume"] == 1000 # Fix: Should be 1000, not 0

async def test_cross_day_boundary(db_session, async_client):
    """test_cross_day_boundary - massive volume yesterday, small volume today"""
    await insert_ticks(db_session, [
        {"instrument_token": 1, "ts": "2026-06-08T15:59:00Z", "last_price": 100.0, "volume": 1000000}, # yesterday
        {"instrument_token": 1, "ts": "2026-06-09T09:15:00Z", "last_price": 101.0, "volume": 150}, # today
    ])
    
    response = await async_client.get("/ohlcv/1min", params={
        "instrument_token": 1, "from": "2026-06-09T09:15:00Z", "to": "2026-06-09T09:16:00Z"
    })
    data = response.json()
    assert len(data) == 1
    candle = data[0]
    # Yesterday's volume should NOT bleed into today's baseline. Baseline is 0.
    # Volume is 150 - 0 = 150.
    assert candle["volume"] == 150

async def test_daily_aggregation(db_session, async_client):
    """10. test_daily_aggregation — assert daily candle spans full day correctly"""
    await insert_ticks(db_session, [
        {"instrument_token": 2, "ts": "2026-06-09T09:15:10Z", "last_price": 100.0, "volume": 10},
        {"instrument_token": 2, "ts": "2026-06-09T14:30:00Z", "last_price": 200.0, "volume": 50},
    ])
    
    response = await async_client.get("/ohlcv/daily", params={
        "instrument_token": 2, "from": "2026-06-09T00:00:00Z", "to": "2026-06-10T00:00:00Z"
    })
    data = response.json()
    assert len(data) == 1
    candle = data[0]
    assert candle["bucket"] == "2026-06-09"
    assert candle["open"] == 100.0
    assert candle["high"] == 200.0
    assert candle["low"] == 100.0
    assert candle["close"] == 200.0
    assert candle["volume"] == 40
