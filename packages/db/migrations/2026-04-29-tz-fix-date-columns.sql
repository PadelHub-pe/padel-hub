-- =============================================================================
-- TZ Fix — convert calendar-day columns from `timestamp` to `date`
-- =============================================================================
--
-- Why this exists
-- ---------------
-- `bookings.date` and `blocked_slots.date` were typed as `timestamp without
-- time zone` but used semantically as a calendar day. Storing a calendar day
-- as a timestamp means it round-trips through whatever the JS / Postgres
-- session "calls midnight" — which on Vercel + Supabase defaults is UTC. The
-- fix in code (T-01..T-08) plus pinning the Postgres session TZ to
-- America/Lima (T-02) converges the on-disk value to "Lima 00:00", but
-- keeping the column as `timestamp` leaves the bug class waiting to recur.
--
-- The right shape is Postgres `DATE`. It stores only year/month/day and is
-- immune to TZ reinterpretation.
--
-- Backfill: NOT NEEDED.
-- ---------------------
-- Existing `bookings.date` / `blocked_slots.date` rows are stored as
-- `'YYYY-MM-DD 00:00:00'`. The cast `'YYYY-MM-DD 00:00:00'::date` returns
-- the same `'YYYY-MM-DD'` regardless of session TZ, so the migration is a
-- pure type change with no value drift.
--
-- The previously-broken UTC `startOfDay` write also stored
-- `'YYYY-MM-DD 00:00:00'` — the same value. So pre-fix and post-fix rows
-- collapse to the same DATE after the cast.
--
-- IMPORTANT: run this migration AFTER deploying the application code that
-- uses Lima-zoned helpers (T-01..T-08) and the Postgres session TZ pin
-- (T-02). Running it before the code is deployed is harmless but the type
-- change is what locks the data shape in.
--
-- ROLLBACK: see the bottom of this file.
-- =============================================================================

BEGIN;

-- 1. Bookings: timestamp → date
ALTER TABLE bookings
  ALTER COLUMN date TYPE date
  USING date::date;

-- 2. Blocked slots: timestamp → date
ALTER TABLE blocked_slots
  ALTER COLUMN date TYPE date
  USING date::date;

-- 3. Sanity check: no NULLs introduced (the columns are NOT NULL anyway,
--    but make this assertion explicit so a misbehaving cast on a future
--    Postgres version surfaces here, not at query time).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM bookings WHERE date IS NULL) THEN
    RAISE EXCEPTION 'bookings.date contains NULLs after migration';
  END IF;
  IF EXISTS (SELECT 1 FROM blocked_slots WHERE date IS NULL) THEN
    RAISE EXCEPTION 'blocked_slots.date contains NULLs after migration';
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- ROLLBACK (run only if needed)
-- =============================================================================
-- BEGIN;
--   ALTER TABLE bookings
--     ALTER COLUMN date TYPE timestamp without time zone
--     USING (date::timestamp);
--   ALTER TABLE blocked_slots
--     ALTER COLUMN date TYPE timestamp without time zone
--     USING (date::timestamp);
-- COMMIT;
