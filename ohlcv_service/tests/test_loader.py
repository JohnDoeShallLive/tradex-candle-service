import pytest
import os
import tempfile
import json
from unittest import mock
from sqlalchemy import text
from loader.load_ticks import main as loader_main
from app.config import settings

def test_loader_idempotent():
    """Test that the loader can run multiple times without duplicating data."""
    # Create temporary ticks file
    ticks_data = [
        {"instrument_token": 1, "ts": "2026-06-09T09:15:10Z", "last_price": 100.0, "volume": 10},
        {"instrument_token": 1, "ts": "2026-06-09T09:15:20Z", "last_price": 105.0, "volume": 25},
    ]
    
    with tempfile.NamedTemporaryFile(mode="w", delete=False) as f:
        for t in ticks_data:
            f.write(json.dumps(t) + "\n")
        temp_file = f.name

    try:
        # Override setting and ensure test DB is used
        with mock.patch("app.config.settings.TICKS_FILE", temp_file):
            with mock.patch("app.config.settings.SYNC_DATABASE_URL", os.getenv("TEST_DATABASE_URL", settings.SYNC_DATABASE_URL).replace('+asyncpg', '')):
                # Run loader
                loader_main()
                
                # Check rows inserted
                from sqlalchemy import create_engine
                engine = create_engine(os.getenv("TEST_DATABASE_URL", settings.SYNC_DATABASE_URL).replace('+asyncpg', ''))
                with engine.connect() as conn:
                    count = conn.execute(text("SELECT count(*) FROM ticks")).scalar()
                    assert count == 2
                
                # Run again
                loader_main()
                with engine.connect() as conn:
                    count = conn.execute(text("SELECT count(*) FROM ticks")).scalar()
                    assert count == 2 # Should still be 2 due to ON CONFLICT DO NOTHING
    finally:
        os.remove(temp_file)
