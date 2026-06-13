import pytest
from app.models import Tick
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_empty_range(db_session, async_client):
    """6. test_empty_range — valid params, no ticks in range -> 200 with []"""
    # Insert tick outside range just so instrument exists
    db_session.add(Tick(instrument_token=1, ts="2026-06-08T09:15:10Z", last_price=100.0, volume=10))
    await db_session.commit()

    response = await async_client.get("/ohlcv/1min", params={
        "instrument_token": 1, "from": "2026-06-09T09:15:00Z", "to": "2026-06-09T09:16:00Z"
    })
    assert response.status_code == 200
    assert response.json() == []

async def test_unknown_instrument(async_client):
    """7. test_unknown_instrument — 404"""
    response = await async_client.get("/ohlcv/1min", params={
        "instrument_token": 999, "from": "2026-06-09T09:15:00Z", "to": "2026-06-09T09:16:00Z"
    })
    assert response.status_code == 404

async def test_invalid_date_range(db_session, async_client):
    """8. test_invalid_date_range — from >= to -> 422"""
    response = await async_client.get("/ohlcv/1min", params={
        "instrument_token": 1, "from": "2026-06-09T09:16:00Z", "to": "2026-06-09T09:15:00Z"
    })
    assert response.status_code == 422

async def test_health_ok(async_client):
    """9. test_health_ok — 200 with status ok"""
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}
