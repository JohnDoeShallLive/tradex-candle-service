# OHLCV Candle Service

A production-grade, highly resilient OHLCV (Open, High, Low, Close, Volume) Candle Service built in Python 3.11+. This service is designed to ingest massive streams of raw market tick data and serve perfectly accurate, dynamically-aggregated OHLCV candles via a REST API on-demand.

## Architecture

The system is designed with a strict separation between data ingestion and API serving, converging on a single PostgreSQL instance as the source of truth.

```mermaid
flowchart TD
    subgraph Data Ingestion
        A[ticks.jsonl file] -->|Parsed line-by-line| B(loader/load_ticks.py)
        B -->|Batch Insert with ON CONFLICT DO NOTHING| C[(PostgreSQL Database)]
    end

    subgraph API Serving
        U[User / Client] -->|GET /ohlcv/1min or /ohlcv/daily| F[FastAPI Application]
        F -->|Raw SQL Query via SQLAlchemy| C
        C -->|Window Functions & CTEs| F
        F -->|JSON Response| U
    end
```

## Why Use This Service?

Financial market data presents several unique engineering challenges:
1. **Out-of-Order Ticks**: Market ticks are not guaranteed to arrive in perfect chronological order due to network latency and exchange architecture.
2. **Cumulative Volume Streams**: Volume data in ticks is often cumulative for the entire trading day rather than representing the delta of a single tick.
3. **Data Integrity**: Building pre-materialized candle tables often leads to race conditions, false deltas, and significant data integrity issues when delayed ticks arrive.

This service solves these problems by:
- **Dynamic SQL Window Aggregation**: We explicitly avoid using pre-materialized tables for candles. Instead, we store the absolute raw truth in a `ticks` table and use advanced PostgreSQL Window Functions and Common Table Expressions (CTEs) to derive exact OHLCV values *on-the-fly*.
- **Idempotent Ingestion**: Our data loader leverages PostgreSQL's `ON CONFLICT DO NOTHING` logic. You can safely restart the loader midway through a massive file or run it repeatedly without duplicating market ticks.
- **Resiliency**: The system gracefully handles missing baseline data, skips malformed JSON stream lines during ingestion without halting the entire process, and isolates cross-day volume bleeds to ensure accurate delta calculations.

## Project Structure

```text
ohlcv_service/
├── app/
│   ├── __init__.py
│   ├── config.py         # Handles all environment variables securely using pydantic-settings
│   ├── database.py       # Configures SQLAlchemy Async Engine (API) and Sync Engine (Setup/Loader)
│   ├── main.py           # FastAPI application factory, routing inclusion, and lifespan context
│   ├── models.py         # SQLAlchemy ORM definitions mapping directly to the `ticks` table
│   ├── queries.py        # Core domain logic: Raw SQL CTEs & Window functions for exact on-demand math
│   ├── schemas.py        # Pydantic models enforcing strict request/response API validation
│   └── routers/
│       ├── health.py     # Liveness probe endpoint for Kubernetes/Docker health checks
│       └── ohlcv.py      # Core business API routes handling the /ohlcv/1min and /ohlcv/daily endpoints
├── loader/
│   └── load_ticks.py     # High-throughput batch ingestion script designed to parse `ticks.jsonl`
├── tests/
│   ├── conftest.py       # Pytest fixtures: spins up ephemeral test DB and configures AsyncClient
│   ├── test_aggregation.py # Mathematical assertions verifying exact OHLCV behavior and edge cases
│   ├── test_api.py       # API behavior testing for various HTTP codes (404, 422, 200)
│   └── test_loader.py    # Asserts the idempotency and fault-tolerance of the ingestion script
├── .dockerignore         # Exclusions for Docker context to ensure lean and fast image builds
├── .env.example          # Template detailing all required environment variables
├── .gitignore            # Git exclusions to prevent committing sensitive data or local environments
├── docker-compose.yml    # Multi-container orchestration linking the FastAPI service and Postgres DB
├── Dockerfile            # Python 3.11-slim API image definition detailing dependency installation
├── README.md             # Detailed documentation (you are currently reading this)
├── requirements.txt      # Explicitly pinned Python dependencies ensuring deterministic builds
└── ticks.jsonl           # Raw market data stream (to be provided by the user)
```

## File Purposes in Depth

### `app/config.py`
Uses `pydantic-settings` to load configurations like database credentials and API ports securely from environment variables. This ensures the application adheres to twelve-factor app principles by never storing hardcoded secrets in the source code.

### `app/models.py`
Defines the `ticks` table schema. We utilize a composite unique index (`instrument_token`, `ts`, `last_price`, `volume`) to ensure absolute data idempotency. By storing the raw ticks rather than aggregating into a `candles` table at ingestion time, we prevent complex rollback logic when delayed ticks arrive. We aggregate entirely at query-time.

### `app/queries.py`
The mathematical heart of the service. It generates the raw PostgreSQL query using Common Table Expressions (`WITH` clauses). It implements critical fixes:
- **The Cross-Day Bleed Fix**: Scopes prior volume lookbacks to the *current trading day* to prevent massive yesterday volumes from creating negative or incorrect volumes today.
- **The First-Tick Fix**: Defaults baseline volumes to `0` so the first bucket of the day correctly reports the exact traded volume.

### `loader/load_ticks.py`
A highly resilient batch-processing CLI tool. It processes 10,000 rows at a time in memory before committing to PostgreSQL, drastically speeding up ingestion. It wraps JSON parsing in a `try/except` block, ensuring that a single malformed line will not crash the ingestion of millions of healthy ticks.

---

## Getting Started: How to Open and Run

### Prerequisites
- You must have [Docker](https://www.docker.com/get-started) and Docker Compose installed on your system.
- Ensure you have the `ticks.jsonl` file provided by the assignment placed in the root of this project folder (`ohlcv_service/ticks.jsonl`).

### Step 1: Open the Project
Open a terminal (or command prompt / PowerShell) and navigate to the project directory:
```bash
cd path/to/ohlcv_service
```

### Step 2: Configure Environment Variables
Copy the provided `.env.example` file to create your local `.env` file. The defaults provided are perfectly suited for running locally with Docker Compose.
```bash
# On Linux/macOS
cp .env.example .env

# On Windows (PowerShell)
Copy-Item .env.example .env
```

### Step 3: Run the Services
Use Docker Compose to build the application image, spin up the database, execute the loader, and start the API web server automatically.
```bash
docker compose up --build
```
**What happens when you run this command?**
1. Docker pulls a `postgres:15-alpine` image and starts the database service.
2. It waits until the database is fully healthy (verified via `pg_isready`).
3. It triggers the `loader/load_ticks.py` script inside the API container, seamlessly parsing and ingesting your `ticks.jsonl` file.
4. Once ingestion finishes, it starts the `uvicorn` web server hosting the FastAPI application.

### Step 4: Access the API
Once the terminal logs indicate that Uvicorn is running, the API is ready. You can test it in your browser or via a tool like `curl` or Postman:

**Health Check Endpoint:**
Open `http://localhost:8000/health` in your browser. You should see:
```json
{"status": "ok", "database": "connected"}
```

---

## API Endpoints Reference

### 1-Minute Candles
`GET /ohlcv/1min`
Fetches exact 1-minute bucketed OHLCV data.
- **Parameters**:
  - `instrument_token` (int, required): The ID of the instrument.
  - `from` (string, required): ISO 8601 UTC start time (inclusive).
  - `to` (string, required): ISO 8601 UTC end time (exclusive).
- **Example Request**:
  ```bash
  curl "http://localhost:8000/ohlcv/1min?instrument_token=408065&from=2026-06-09T09:15:00Z&to=2026-06-09T10:00:00Z"
  ```

### Daily Candles
`GET /ohlcv/daily`
Fetches exact daily bucketed OHLCV data.
- **Parameters**: Same as 1-Minute Candles.
- **Example Request**:
  ```bash
  curl "http://localhost:8000/ohlcv/daily?instrument_token=408065&from=2026-06-09T00:00:00Z&to=2026-06-10T00:00:00Z"
  ```

---

## Running the Test Suite

We verify the application against strict mathematical realities, not just HTTP status codes. The test suite asserts the correctness of the SQL aggregations, the API behaviors, and the loader's idempotency.

To run the test suite, you must have an active PostgreSQL database instance accessible. 
1. If your Docker Compose stack is running, you can use that database instance.
2. In a separate terminal window, ensure you are in the `ohlcv_service` directory and set the `TEST_DATABASE_URL` environment variable:

```bash
# Linux/macOS
export TEST_DATABASE_URL=postgresql+asyncpg://ohlcv:ohlcv@localhost:5432/ohlcv

# Windows (PowerShell)
$env:TEST_DATABASE_URL="postgresql+asyncpg://ohlcv:ohlcv@localhost:5432/ohlcv"
```

3. Execute the tests using Pytest:
```bash
pytest -v
```
All tests will output as PASSED, verifying everything from edge-case volume deltas to cross-day bucket isolation.
