/*
  # Automatikus lejárat és törlés — licitek és hirdetések

  ## Összefoglalás
  Ez a migráció automatizálja a licitek lezárását és a rekordok törlését:

  1. **pg_cron engedélyezése** – ütemező bővítmény telepítése
  2. **Licitek automatikus lezárása** – ha az `ends_at` lejárt és a státusz még 'active',
     átállítja 'ended'-re, és beállítja az `ended_at` időpontot
  3. **48 órás törlési szabályok:**
     - Lezárt licitek (`status = 'ended'` és `ended_at` > 48 órája) → törlés
     - Eladottként jelölt hirdetések (`status = 'sold'` és `sold_at` > 48 órája) → törlés
     - Aktív hirdetések és licitek SOHA nem törlődnek automatikusan
  4. **Cron job-ok beállítása** – 5 percenként fut az auto-end, óránként a törlés

  ## Változások

  ### Új funkciók
  - `public.auto_end_expired_auctions()` – lezárja a lejárt liciteket
  - `public.cleanup_expired_records()` – törli a 48+ órás ended/sold rekordokat

  ### Cron job-ok (pg_cron)
  - `auto-end-auctions` – 5 percenként: lejárt licitek lezárása
  - `cleanup-expired-records` – óránként: 48 óra után törlés

  ### Biztonsági megjegyzések
  - Csak 'ended' státuszú licitek törlődnek, amelyek legalább 48 órája zártak
  - Csak 'sold' státuszú hirdetések törlődnek, amelyek legalább 48 órája eladottak
  - Active, deleted, cancelled rekordokat NEM érint ez a logika
*/

-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ─── FUNCTION 1: Auto-end expired auctions ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_end_expired_auctions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE auctions
  SET
    status = 'ended',
    ended_at = now()
  WHERE
    status = 'active'
    AND timer_started = true
    AND ends_at IS NOT NULL
    AND ends_at <= now();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- ─── FUNCTION 2: Cleanup ended auctions and sold listings after 48h ──────────
CREATE OR REPLACE FUNCTION public.cleanup_expired_records()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer := 0;
  temp_count integer;
BEGIN
  -- Delete ended auctions (ended_at older than 48 hours)
  -- Also delete their corresponding listing record
  DELETE FROM listings
  WHERE id IN (
    SELECT a.listing_id
    FROM auctions a
    WHERE a.status = 'ended'
      AND a.ended_at IS NOT NULL
      AND a.ended_at <= now() - interval '48 hours'
  );

  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  -- Delete ended auctions themselves
  DELETE FROM auctions
  WHERE status = 'ended'
    AND ended_at IS NOT NULL
    AND ended_at <= now() - interval '48 hours';

  -- Delete sold listings (sold_at older than 48 hours)
  DELETE FROM listings
  WHERE status = 'sold'
    AND sold_at IS NOT NULL
    AND sold_at <= now() - interval '48 hours'
    AND listing_type = 'regular';

  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  RETURN deleted_count;
END;
$$;

-- ─── CRON JOB 1: Auto-end expired auctions every 5 minutes ──────────────────
SELECT cron.schedule(
  'auto-end-auctions',
  '*/5 * * * *',
  'SELECT public.auto_end_expired_auctions()'
);

-- ─── CRON JOB 2: Cleanup expired records every hour ─────────────────────────
SELECT cron.schedule(
  'cleanup-expired-records',
  '0 * * * *',
  'SELECT public.cleanup_expired_records()'
);
