# OHLCV Candle Service

A production-grade OHLCV (Open, High, Low, Close, Volume) Candle Service built in Python 3.11+.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Application Preview](#application-preview)
- [System Architecture](#system-architecture)
  - [High-Level Architecture](#high-level-architecture)
  - [Request Flow](#request-flow)
  - [Component Interaction](#component-interaction)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Application Workflow](#application-workflow)
- [Database Design](#database-design)
- [API Documentation](#api-documentation)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Design Decisions](#design-decisions)
- [Security Considerations](#security-considerations)
- [Scalability Considerations](#scalability-considerations)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)
- [Author](#author)
- [Acknowledgements](#acknowledgements)

---

## Overview

The OHLCV Candle Service is a high-performance backend application designed to ingest massive streams of raw financial market tick data and serve dynamically aggregated OHLCV candles via a REST API on-demand. 

Financial market data is inherently messy. Ticks arrive out-of-order, cumulative volume streams can reset or jump, and building pre-materialized candle tables often leads to race conditions, false volume deltas, and data integrity issues. This project solves these problems by utilizing raw SQL Window Functions to derive mathematically perfect candles strictly at query time, guaranteeing absolute data integrity regardless of ingestion order.

**Target Audience:**
- Algorithmic Trading Systems
- Financial Data Analytics Platforms
- Quantitative Researchers

---

## Key Features

| Feature | Description |
| ------- | ----------- |
| Dynamic SQL Aggregation | Computes OHLCV perfectly at query time using PostgreSQL Window Functions. |
| Idempotent Ingestion | Handles raw `.jsonl` files via `ON CONFLICT DO NOTHING` for safe reruns. |
| Resilience | Skips malformed JSON lines during ingest without halting the process. |
| True Delta Volumes | Calculates true interval volume from cumulative daily streams, isolating cross-day bleed. |
| Out-of-Order Safety | Agnostic to the chronological arrival of ticks; computes correctly regardless of insert order. |

---

## Application Preview

```md
![Dashboard Placeholder](docs/images/dashboard.png)
```

*(Note: This is a backend API service. Visual previews would apply to consuming frontends or dashboards mapping this API data).*

---

## System Architecture

### High-Level Architecture

```mermaid
graph TD
    A[Raw Data: ticks.jsonl] -->|Ingested via| B[Loader Script load_ticks.py]
    B -->|Batch Inserts| C[(PostgreSQL Database)]
    D[Client App] -->|HTTP GET Request| E[FastAPI Web Server]
    E -->|Raw SQL Query| C
    C -->|Calculated Aggregations| E
    E -->|JSON Response| D
```
*The architecture strictly separates the high-throughput batch ingestion script from the low-latency HTTP serving layer, using the database as the sole source of truth.*

### Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant FastAPI
    participant PostgreSQL
    
    Client->>FastAPI: GET /ohlcv/1min?instrument_token=1&from=...&to=...
    FastAPI->>FastAPI: Validate parameters (Pydantic)
    FastAPI->>PostgreSQL: Execute Check: Does instrument exist?
    PostgreSQL-->>FastAPI: Return boolean
    FastAPI->>PostgreSQL: Execute SQL Window Aggregation
    PostgreSQL-->>FastAPI: Return aggregated bucket rows
    FastAPI->>Client: Return JSON Candle Array
```
*The request flow ensures data exists before performing heavy window function calculations, failing fast with a 404 if the instrument is unknown.*

### Component Interaction

```mermaid
graph LR
    R[Routers] --> Q[Queries]
    R --> S[Schemas]
    Q --> DB[(Database Session)]
    M[Models] --> DB
```
*The API is organized into strict layers: Routers handle transport, Schemas handle validation, Queries handle SQL logic, and Models represent the ORM.*

---

## Tech Stack

### Backend
| Technology | Purpose | Reason for Selection |
| ---------- | ------- | -------------------- |
| Python 3.11+ | Core Language | Industry standard for data engineering and backend services. |
| FastAPI | Web Framework | High performance, async native, and automatic OpenAPI generation. |
| SQLAlchemy | ORM & Query Builder | Robust database interactions and async session management. |
| Pydantic | Validation | Strict request/response validation and environment config parsing. |

### Database
| Technology | Purpose | Reason for Selection |
| ---------- | ------- | -------------------- |
| PostgreSQL 15 | Primary Datastore | Advanced Window Functions (FIRST_VALUE, LAST_VALUE) required for exact math. |
| asyncpg | DB Driver | High-performance asynchronous database driver for Python. |

### DevOps & Testing
| Technology | Purpose | Reason for Selection |
| ---------- | ------- | -------------------- |
| Docker & Compose | Containerization | Reproducible local environments and seamless deployment. |
| Pytest | Testing Framework | Comprehensive fixture support and async testing capabilities. |

---

## Project Structure

```bash
ohlcv_service/
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── queries.py
│   ├── schemas.py
│   └── routers/
│       ├── health.py
│       └── ohlcv.py
├── loader/
│   └── load_ticks.py
├── tests/
│   ├── conftest.py
│   ├── test_aggregation.py
│   ├── test_api.py
│   └── test_loader.py
├── .dockerignore
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── README.md
└── requirements.txt
```

| Path | Purpose | Example Usage |
| ---- | ------- | ------------- |
| `app/config.py` | Environment variable parsing | `settings.DATABASE_URL` |
| `app/models.py` | Table definitions | `Base.metadata.create_all()` |
| `app/queries.py` | Raw SQL aggregation logic | `get_candle_query("1min")` |
| `loader/load_ticks.py` | High throughput ingestion | `python -m loader.load_ticks` |
| `tests/` | Mathematical & API tests | `pytest -v` |

---

## Application Workflow

### Data Ingestion Flow
1. **Read Stream**: `loader/load_ticks.py` opens `ticks.jsonl`.
2. **Parse & Buffer**: Validates JSON and buffers 10,000 rows in memory.
3. **Commit**: Executes bulk `INSERT ... ON CONFLICT DO NOTHING` to PostgreSQL.

### Query Flow
1. **Request**: User requests `/ohlcv/1min`.
2. **Filter**: Database filters `ticks` by time range and `instrument_token`.
3. **Reference Volume**: Database calculates the volume baseline from the previous tick or start of day.
4. **Aggregate**: Window functions compute `open`, `high`, `low`, `close`, and subtract baseline from `max(volume)` per bucket.
5. **Format**: FastAPI formats the ISO strings and returns the response.

---

## Database Design

The system relies on a single raw data table. There are no pre-computed candle tables.

```mermaid
erDiagram
    TICKS {
        bigserial id PK
        integer instrument_token "Indexed"
        timestamptz ts "Indexed"
        numeric last_price 
        bigint volume 
        timestamptz loaded_at 
    }
```

- **Indexes**: 
  - `idx_ticks_instrument_ts` (`instrument_token`, `ts`): Accelerates time-range queries.
  - `idx_ticks_unique_tick` (`instrument_token`, `ts`, `last_price`, `volume`): Unique constraint ensuring ingestion idempotency.

---

## API Documentation

### GET /ohlcv/1min

Retrieves 1-minute bucketed OHLCV candles.

#### Parameters
| Name | In | Type | Required | Description |
| ---- | -- | ---- | -------- | ----------- |
| `instrument_token` | query | integer | Yes | The ID of the financial instrument. |
| `from` | query | string | Yes | ISO 8601 UTC start time (inclusive). |
| `to` | query | string | Yes | ISO 8601 UTC end time (exclusive). |

#### Request Example
```http
GET /ohlcv/1min?instrument_token=408065&from=2026-06-09T09:15:00Z&to=2026-06-09T10:00:00Z
```

#### Response Example
```json
[
  {
    "bucket": "2026-06-09T09:15:00",
    "open": 1523.45,
    "high": 1530.10,
    "low": 1521.00,
    "close": 1528.75,
    "volume": 14200
  }
]
```

#### Status Codes
- `200 OK`: Successful retrieval.
- `404 Not Found`: Instrument token does not exist in the database.
- `422 Unprocessable Entity`: Invalid parameters or `from` is after `to`.

---

### GET /ohlcv/daily

Retrieves daily bucketed OHLCV candles grouped by calendar day.

#### Parameters
Same as `/ohlcv/1min`.

#### Response Example
```json
[
  {
    "bucket": "2026-06-09",
    "open": 1523.45,
    "high": 1550.00,
    "low": 1500.00,
    "close": 1545.00,
    "volume": 850000
  }
]
```

---

### GET /health

Retrieves the health status of the database and API.

#### Response Example
```json
{"status": "ok", "database": "connected"}
```
- `200 OK`: System healthy.
- `503 Service Unavailable`: Database unreachable.

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- A valid `ticks.jsonl` file containing market data.

### Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd ohlcv_service
```

#### 2. Provide Data
Place your `ticks.jsonl` file in the root directory.

#### 3. Configure Environment
```bash
cp .env.example .env
```
*The default `.env` variables are pre-configured to work out-of-the-box with Docker Compose.*

#### 4. Start Application
```bash
docker compose up --build
```

---

## Testing

The test suite asserts the strict mathematical reality of the window function aggregations, checking edge cases like cross-day boundaries and out-of-order tick arrival.

To test locally, ensure a PostgreSQL instance is running:

```bash
export TEST_DATABASE_URL="postgresql+asyncpg://ohlcv:ohlcv@localhost:5432/ohlcv_test"
pytest -v
```

Expected Output:
```text
tests/test_aggregation.py ...... [ 60%]
tests/test_api.py ....           [ 90%]
tests/test_loader.py .           [100%]
= 11 passed in 1.23s =
```

---

## Design Decisions

### Why on-demand SQL aggregation instead of materialized candles?
Market ticks are not guaranteed to arrive in timestamp order. A delayed tick arriving minutes or hours late would require complex rollback and recalculation logic in a materialized table. By keeping the raw ticks as the source of truth and aggregating on-demand, we eliminate race conditions entirely.

### Why Postgres Window Functions?
To correctly derive OHLC, we need the chronological first and last price within a bucket. Traditional `GROUP BY` cannot guarantee ordering. Window functions like `FIRST_VALUE()` over an ordered partition solve this elegantly at the database level.

### Why Batch Ingestion?
Inserting millions of rows one-by-one is bottlenecked by network round-trips. Grouping them into batches of 10,000 ensures maximum network throughput and database disk efficiency.

---

## Security Considerations

- **Secrets Management**: Credentials and connection strings are managed entirely via `.env` variables and Pydantic Settings. No secrets are committed to the codebase.
- **SQL Injection**: All raw SQL queries use parameterized arguments (`text(query)` mapped with SQLAlchemy parameter dictionaries), making them completely immune to SQL injection.
- **Input Validation**: FastAPI automatically validates datetimes and integers, preventing malformed inputs from ever reaching the database query logic.

---

## Scalability Considerations

**Current Limits:**
- The current SQL aggregation is extremely fast for standard lookback windows (e.g., querying 1 month of 1-minute candles).
- The `ticks.jsonl` loader is bounded by the speed of JSON parsing and single-threaded execution.

**Future Improvements:**
- Partitioning the `ticks` table natively in PostgreSQL by month or year to speed up index scans.
- Utilizing TimescaleDB (a Postgres extension) for continuous aggregates if query volumes exceed the limits of on-the-fly computation.
- Parallelizing the ingestion script to read chunks of the `.jsonl` file concurrently.

---

## Troubleshooting

### Database not connecting on startup
Ensure port `5432` is not already in use by a local PostgreSQL installation before running Docker Compose.

### Port already in use
If the API fails to bind to `8000`, modify the `API_PORT` in your `.env` file and the exposed port in `docker-compose.yml`.

### Loader skipping rows
Check the loader output logs. If you see `Skipping malformed row`, it means the `ticks.jsonl` file contains invalid JSON or missing keys. The application will continue running gracefully.

---

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Ensure all tests pass (`pytest`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Roadmap

| Version | Features |
| ------- | -------- |
| v1.0.0 | Initial release: 1min & daily candles, raw SQL aggregation, resilient loader |
| v1.1.0 | Migration to SQLAlchemy Core constructs for robust programmatic queries |
| v1.2.0 | Support for custom arbitrary timeframes (e.g., 5min, 15min, 4hour) |
| v2.0.0 | TimescaleDB integration for continuous materialized views |

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Author

**John Doe**
- GitHub: [github.com/johndoe](#)
- LinkedIn: [linkedin.com/in/johndoe](#)
- Portfolio: [johndoe.dev](#)

---

## Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/) for the incredible web framework.
- [SQLAlchemy](https://www.sqlalchemy.org/) for robust database tooling.
- Advanced PostgreSQL Window Function documentation.
