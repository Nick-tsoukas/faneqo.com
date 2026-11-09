-- migrate-musicbizqr-hosts-to-faneqo.sql
-- Audit issue: data-001 (tasks/audit-issues.md)
--
-- Replace marketing brand/host tokens in Postgres (Strapi staging or a prod copy):
--   https://www.musicbizqr.com → https://www.faneqo.com
--   https://musicbizqr.com     → https://faneqo.com
--   (http:// twins)
--   bare www.musicbizqr.com / musicbizqr.com → www.faneqo.com / faneqo.com
--   MusicBizQR → Faneqo
--   musicbizqr → faneqo  (after host replaces; protected hosts restored)
--
-- CARVE-OUTS (protected during replace, then restored):
--   qr.musicbizqr.com
--   api.musicbizqr.com
--
-- App code carve-outs (not this SQL): domain-migration / QR gateway allowlists must
-- still list legacy marketing hosts for inbound redirects.
--
-- USAGE (all envs)
--   1. Backup first (especially prod).
--   2. From workspace root, run with psql -v ON_ERROR_STOP=1 -f this file.
--   3. File prints dry-run NOTICE counts, then APPLY, then COMMIT.
--   4. Validate-only: change the final COMMIT to ROLLBACK before running.
--   5. Re-run after COMMIT; second apply should update 0 rows (idempotent).
--
-- This script is Postgres-only (Strapi non-development). It does not run against
-- SQLite. Path below: scripts/sql/migrate-musicbizqr-hosts-to-faneqo.sql
--
-- ---------------------------------------------------------------------------
-- DEV (local `npm run dev`)
-- ---------------------------------------------------------------------------
-- Default development uses SQLite (backend/.tmp/data.db). Product database.js
-- ignores DATABASE_URL when NODE_ENV=development. Do NOT run this .sql on SQLite.
--
-- Options:
--   A) No Postgres content in dev → skip SQL; fix seed/fixtures in code only.
--   B) You already have local compose Postgres with rows to clean (unusual for
--      pure `npm run dev`) → treat like local staging (port 5433) below.
--   C) Need a Postgres copy of content for local work → restore a scrubbed dump
--      into local compose `faneqo_staging` (or a dedicated local DB), then:
--
--   # From repo root; uses root .env DATABASE_URL if it points at local compose.
--   set -a && source .env && set +a
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -f scripts/sql/migrate-musicbizqr-hosts-to-faneqo.sql
--
--   # Or explicit local compose (default example.env staging URL):
--   psql "postgresql://faneqo:faneqo@127.0.0.1:5433/faneqo_staging?sslmode=disable" \
--     -v ON_ERROR_STOP=1 -f scripts/sql/migrate-musicbizqr-hosts-to-faneqo.sql
--
-- ---------------------------------------------------------------------------
-- STAGING (local compose or DO droplet)
-- ---------------------------------------------------------------------------
-- Local attached staging (host publishes Postgres 5433 → container 5432):
--   docker compose up -d postgres   # if not already up
--   psql "postgresql://faneqo:faneqo@127.0.0.1:5433/faneqo_staging?sslmode=disable" \
--     -v ON_ERROR_STOP=1 -f scripts/sql/migrate-musicbizqr-hosts-to-faneqo.sql
--
-- Droplet (/opt/faneqo; same compose credentials):
--   ssh root@159.203.131.189
--   cd /opt/faneqo
--   # Prefer exec into the postgres container (no host port required):
--   docker compose exec -T postgres \
--     psql -U faneqo -d faneqo_staging -v ON_ERROR_STOP=1 \
--     < scripts/sql/migrate-musicbizqr-hosts-to-faneqo.sql
--   # Or from laptop if 5433 is firewalled closed, tunnel first:
--   #   ssh -L 5433:127.0.0.1:5433 root@159.203.131.189
--   #   then use the local 5433 psql URL above.
--
-- Never point staging DATABASE_URL at Railway prod / chalk-volume.
-- See docs/staging-data.md §D.
--
-- ---------------------------------------------------------------------------
-- PROD (Railway qrserver Postgres / chalk-volume)
-- ---------------------------------------------------------------------------
-- Requires explicit human go (audit data-001 / cutover policy). Live data.
--
-- 1. Snapshot / backup Railway Postgres before apply (Railway UI backup or
--    pg_dump via the public TCP proxy / railway CLI). Keep the dump until
--    verified.
-- 2. Get DATABASE_URL from the Railway backend (qrserver) or Postgres service
--    variables — do not invent hosts. Private host postgres.railway.internal
--    only works from inside Railway; from a laptop use the public TCP proxy
--    URL Railway shows for the Postgres service (AGENTS.md: public proxy → 5432).
-- 3. Prefer running from a one-off Railway shell that already has DATABASE_URL:
--
--   # Example shape — use your real project/service flags:
--   railway run -s qrserver -- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -f scripts/sql/migrate-musicbizqr-hosts-to-faneqo.sql
--
--   # Or laptop with public proxy URL (ssl usually required):
--   psql "$RAILWAY_POSTGRES_PUBLIC_URL" -v ON_ERROR_STOP=1 \
--     -f scripts/sql/migrate-musicbizqr-hosts-to-faneqo.sql
--
-- 4. First pass on a restored *copy* with ROLLBACK (or a throwaway Railway
--    DB) before COMMIT on live chalk-volume.
-- 5. After COMMIT: spot-check seo_pages content; re-run file (expect 0 updates).
--
-- Strapi v4 default DB column names are snake_case (meta_title, not metaTitle).

CREATE OR REPLACE FUNCTION pg_temp.faneqo_protect_hosts(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN t IS NULL THEN NULL
    ELSE replace(
           replace(t, 'qr.musicbizqr.com', '__FANEQO_PROTECT_QR_MBQ__'),
           'api.musicbizqr.com', '__FANEQO_PROTECT_API_MBQ__'
         )
  END
$$;

CREATE OR REPLACE FUNCTION pg_temp.faneqo_restore_hosts(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN t IS NULL THEN NULL
    ELSE replace(
           replace(t, '__FANEQO_PROTECT_QR_MBQ__', 'qr.musicbizqr.com'),
           '__FANEQO_PROTECT_API_MBQ__', 'api.musicbizqr.com'
         )
  END
$$;

CREATE OR REPLACE FUNCTION pg_temp.faneqo_rewrite_brand(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN t IS NULL THEN NULL
    ELSE pg_temp.faneqo_restore_hosts(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      pg_temp.faneqo_protect_hosts(t),
                      'https://www.musicbizqr.com', 'https://www.faneqo.com'
                    ),
                    'http://www.musicbizqr.com', 'http://www.faneqo.com'
                  ),
                  'https://musicbizqr.com', 'https://faneqo.com'
                ),
                'http://musicbizqr.com', 'http://faneqo.com'
              ),
              'www.musicbizqr.com', 'www.faneqo.com'
            ),
            'musicbizqr.com', 'faneqo.com'
          ),
          'MusicBizQR', 'Faneqo'
        ),
        'musicbizqr', 'faneqo'
      )
    )
  END
$$;

CREATE OR REPLACE FUNCTION pg_temp.faneqo_needs_rewrite(t text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT t IS NOT NULL
    AND (
      position('musicbizqr.com' in t) > 0
      OR position('MusicBizQR' in t) > 0
      OR position('musicbizqr' in t) > 0
    )
    AND pg_temp.faneqo_rewrite_brand(t) IS DISTINCT FROM t
$$;

-- -----------------------------------------------------------------------------
-- DRY RUN: seo_pages
-- -----------------------------------------------------------------------------
SELECT 'seo_pages' AS table_name, count(*) AS rows_needing_rewrite
FROM seo_pages
WHERE pg_temp.faneqo_needs_rewrite(title)
   OR pg_temp.faneqo_needs_rewrite(slug)
   OR pg_temp.faneqo_needs_rewrite(meta_title)
   OR pg_temp.faneqo_needs_rewrite(meta_description)
   OR pg_temp.faneqo_needs_rewrite(content)
   OR pg_temp.faneqo_needs_rewrite(keywords)
   OR pg_temp.faneqo_needs_rewrite(executive_summary)
   OR pg_temp.faneqo_needs_rewrite(COALESCE(json_ld::text, ''))
   OR pg_temp.faneqo_needs_rewrite(COALESCE(executive_summary_takeaways::text, ''));

-- DRY RUN: catalog notice for every public text/varchar/json/jsonb column
DO $$
DECLARE
  r record;
  cnt bigint;
  sql text;
BEGIN
  RAISE NOTICE '=== DRY RUN catalog matches ===';
  FOR r IN
    SELECT c.table_schema, c.table_name, c.column_name, c.data_type
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND c.data_type IN ('text', 'character varying', 'json', 'jsonb')
    ORDER BY 1, 2, 3
  LOOP
    IF r.data_type IN ('json', 'jsonb') THEN
      sql := format(
        'SELECT count(*) FROM %I.%I WHERE pg_temp.faneqo_needs_rewrite(%I::text)',
        r.table_schema, r.table_name, r.column_name
      );
    ELSE
      sql := format(
        'SELECT count(*) FROM %I.%I WHERE pg_temp.faneqo_needs_rewrite(%I)',
        r.table_schema, r.table_name, r.column_name
      );
    END IF;
    BEGIN
      EXECUTE sql INTO cnt;
      IF cnt > 0 THEN
        RAISE NOTICE '%.%.% (%) → % rows',
          r.table_schema, r.table_name, r.column_name, r.data_type, cnt;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'skip %.%.%: %', r.table_schema, r.table_name, r.column_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- APPLY
-- -----------------------------------------------------------------------------
BEGIN;

UPDATE seo_pages SET
  title = pg_temp.faneqo_rewrite_brand(title),
  slug = pg_temp.faneqo_rewrite_brand(slug),
  meta_title = pg_temp.faneqo_rewrite_brand(meta_title),
  meta_description = pg_temp.faneqo_rewrite_brand(meta_description),
  content = pg_temp.faneqo_rewrite_brand(content),
  keywords = pg_temp.faneqo_rewrite_brand(keywords),
  executive_summary = pg_temp.faneqo_rewrite_brand(executive_summary),
  json_ld = CASE
    WHEN json_ld IS NULL THEN NULL
    ELSE pg_temp.faneqo_rewrite_brand(json_ld::text)::jsonb
  END,
  executive_summary_takeaways = CASE
    WHEN executive_summary_takeaways IS NULL THEN NULL
    ELSE pg_temp.faneqo_rewrite_brand(executive_summary_takeaways::text)::jsonb
  END
WHERE pg_temp.faneqo_needs_rewrite(title)
   OR pg_temp.faneqo_needs_rewrite(slug)
   OR pg_temp.faneqo_needs_rewrite(meta_title)
   OR pg_temp.faneqo_needs_rewrite(meta_description)
   OR pg_temp.faneqo_needs_rewrite(content)
   OR pg_temp.faneqo_needs_rewrite(keywords)
   OR pg_temp.faneqo_needs_rewrite(executive_summary)
   OR pg_temp.faneqo_needs_rewrite(COALESCE(json_ld::text, ''))
   OR pg_temp.faneqo_needs_rewrite(COALESCE(executive_summary_takeaways::text, ''));

DO $$
DECLARE
  r record;
  sql text;
  updated bigint;
BEGIN
  FOR r IN
    SELECT c.table_schema, c.table_name, c.column_name, c.data_type
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND c.table_name <> 'seo_pages'
      AND c.data_type IN ('text', 'character varying', 'json', 'jsonb')
    ORDER BY 1, 2, 3
  LOOP
    IF r.data_type IN ('json', 'jsonb') THEN
      sql := format(
        'UPDATE %I.%I SET %I = pg_temp.faneqo_rewrite_brand(%I::text)::%s
         WHERE pg_temp.faneqo_needs_rewrite(%I::text)',
        r.table_schema, r.table_name, r.column_name, r.column_name, r.data_type,
        r.column_name
      );
    ELSE
      sql := format(
        'UPDATE %I.%I SET %I = pg_temp.faneqo_rewrite_brand(%I)
         WHERE pg_temp.faneqo_needs_rewrite(%I)',
        r.table_schema, r.table_name, r.column_name, r.column_name, r.column_name
      );
    END IF;
    BEGIN
      EXECUTE sql;
      GET DIAGNOSTICS updated = ROW_COUNT;
      IF updated > 0 THEN
        RAISE NOTICE 'updated %.%.% → % rows',
          r.table_schema, r.table_name, r.column_name, updated;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'skip update %.%.%: %',
        r.table_schema, r.table_name, r.column_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- Validate on a copy with ROLLBACK instead of COMMIT if needed.
COMMIT;
