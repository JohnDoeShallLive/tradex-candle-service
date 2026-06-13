import sys
import json
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Ensure app is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import settings
from app.models import Base

def main():
    ticks_file = Path(settings.TICKS_FILE)
    if not ticks_file.exists():
        print(f"Error: Ticks file not found at {settings.TICKS_FILE}", file=sys.stderr)
        sys.exit(1)

    engine = create_engine(settings.SYNC_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    
    batch_size = 10000
    total_inserted = 0
    
    with Session() as session:
        with open(ticks_file, 'r') as f:
            batch = []
            for line in f:
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    batch.append({
                        "instrument_token": data["instrument_token"],
                        "ts": data["ts"],
                        "last_price": data["last_price"],
                        "volume": data["volume"]
                    })
                except (json.JSONDecodeError, KeyError) as e:
                    print(f"Skipping malformed row: {line.strip()} - Error: {e}", file=sys.stderr)
                    continue
                
                if len(batch) >= batch_size:
                    inserted = insert_batch(session, batch)
                    total_inserted += inserted
                    batch = []
            
            if batch:
                inserted = insert_batch(session, batch)
                total_inserted += inserted

    print(f"Total rows inserted: {total_inserted}")

def insert_batch(session, batch):
    sql = text("""
        INSERT INTO ticks (instrument_token, ts, last_price, volume)
        VALUES (:instrument_token, :ts, :last_price, :volume)
        ON CONFLICT (instrument_token, ts, last_price, volume) DO NOTHING
    """)
    res = session.execute(sql, batch)
    session.commit()
    return res.rowcount

if __name__ == "__main__":
    main()
