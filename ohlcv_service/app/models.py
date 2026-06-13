from sqlalchemy import Column, BigInteger, Integer, Numeric, DateTime, Index
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class Tick(Base):
    __tablename__ = "ticks"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    instrument_token = Column(Integer, nullable=False)
    ts = Column(DateTime(timezone=True), nullable=False)
    last_price = Column(Numeric(18, 4), nullable=False)
    volume = Column(BigInteger, nullable=False)
    loaded_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        Index("idx_ticks_instrument_ts", "instrument_token", "ts"),
        Index("idx_ticks_unique_tick", "instrument_token", "ts", "last_price", "volume", unique=True),
    )
