# OHLCV Candle Service

A production-grade OHLCV Candle Service in Python 3.11+ using FastAPI, SQLAlchemy, and PostgreSQL.

## How to run

1. Provide your `ticks.jsonl` file in the root directory.
2. Run the services using Docker Compose:
```bash
docker compose up
```
The API will be available at `http://localhost:8000`.

## How to test

To run the tests (make sure a postgres database is running and accessible):
```bash
# Setup a test database and set the environment variable
export TEST_DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/ohlcv_test
pytest -v
```

## Data Model

The application uses a single `ticks` table to store all raw market tick data. 
There is no pre-materialized candle table. The schema ensures quick inserts and idempotent loading via a unique constraint on `(instrument_token, ts, last_price, volume)`.

## Tradeoff Defense: On-demand SQL aggregation vs Materialized candles

This project calculates OHLCV candles entirely on-demand via SQL window functions instead of pre-aggregating them into a materialized candle table. 
For this specific use case, this is the correct approach because:
1. **Out-of-order ticks**: Market ticks are not guaranteed to arrive in timestamp order. Materialized candles would require complex update logic to retroactively modify past buckets, dealing with race conditions and out-of-order data streams.
2. **Exact Volume Delta**: Volume is a cumulative day-to-date total. By computing it dynamically using window functions against the prior ticks, we handle edge cases correctly, such as the first bucket of the day.
3. **Simplicity and Integrity**: We avoid data duplication and complex state management on the application side. The database acts as the single source of truth and performs the heavy lifting, ensuring perfectly accurate aggregation every time.
