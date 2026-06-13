def get_candle_query(bucket_type: str) -> str:
    if bucket_type == "daily":
        trunc_expr = "date_trunc('day', ts)"
    else:
        trunc_expr = "date_trunc('minute', ts)"

    return f"""
    WITH
    bucketed AS (
        SELECT instrument_token, {trunc_expr} AS bucket, ts, id, last_price, volume
        FROM ticks
        WHERE instrument_token = :instrument_token AND ts >= :from_ts AND ts < :to_ts
    ),
    prior_vol AS (
        SELECT DISTINCT ON (instrument_token, bucket)
            b.instrument_token, b.bucket,
            COALESCE(
                (SELECT volume FROM ticks t2
                 WHERE t2.instrument_token = b.instrument_token 
                   AND t2.ts < b.bucket
                   AND date_trunc('day', t2.ts) = date_trunc('day', b.bucket)
                 ORDER BY t2.ts DESC, t2.id DESC LIMIT 1),
                0
            ) AS ref_volume
        FROM bucketed b
    ),
    aggregated AS (
        SELECT
            b.bucket,
            FIRST_VALUE(b.last_price) OVER w  AS open,
            MAX(b.last_price)         OVER w  AS high,
            MIN(b.last_price)         OVER w  AS low,
            LAST_VALUE(b.last_price)  OVER w  AS close,
            MAX(b.volume)             OVER w  AS max_vol_in_bucket,
            p.ref_volume
        FROM bucketed b JOIN prior_vol p USING (instrument_token, bucket)
        WINDOW w AS (
            PARTITION BY b.bucket ORDER BY b.ts, b.id
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        )
    )
    SELECT DISTINCT bucket, open, high, low, close,
        max_vol_in_bucket - ref_volume AS volume
    FROM aggregated ORDER BY bucket;
    """
