import pytest
import pytest_asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import create_engine, text
from httpx import AsyncClient, ASGITransport
from typing import AsyncGenerator

from app.models import Base
from app.main import app
from app.database import get_db

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql+asyncpg://ohlcv:ohlcv@localhost:5432/ohlcv_test")
SYNC_TEST_DATABASE_URL = TEST_DATABASE_URL.replace('+asyncpg', '')

# Async Engine for testing
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)

# Sync Engine to manage tables
sync_test_engine = create_engine(SYNC_TEST_DATABASE_URL)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Attempt to create tables
    try:
        Base.metadata.drop_all(bind=sync_test_engine)
        Base.metadata.create_all(bind=sync_test_engine)
    except Exception as e:
        print(f"Failed to connect to test db: {e}")
    yield
    try:
        Base.metadata.drop_all(bind=sync_test_engine)
    except Exception:
        pass

@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session
        # Truncate tables after each test
        try:
            await session.execute(text("TRUNCATE TABLE ticks RESTART IDENTITY CASCADE"))
            await session.commit()
        except Exception:
            pass

@pytest_asyncio.fixture
async def async_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()
