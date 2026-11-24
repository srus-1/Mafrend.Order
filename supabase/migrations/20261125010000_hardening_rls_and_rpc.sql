-- ============================================================================
-- Migration: 20261125010000_hardening_rls_and_rpc.sql
-- Description:
--   1. Atomic order_number sequence + RPC `public.next_order_number(p_prefix)`
--   2. Atomic batch queue reorder RPC `public.reorder_orders_batch(p_ids)`
--   3. Harden RLS policies across orders, order_design_files, capex_entries,
--      raw_material_entries, product_catalog, and storage.objects (design-files)
--      so anonymous unauthenticated callers cannot read/modify/delete workshop data.
-- Prerequisite before applying to production:
--   Enable Email/Password Auth in Supabase Dashboard and create staff accounts.
-- ============================================================================

-- 1. Atomic Sequence & RPC for Unique Order Numbers
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Seed sequence ahead of any existing MF numeric suffix in public.orders
DO $$
DECLARE
  v_max_seq bigint;
BEGIN
  SELECT COALESCE(
    MAX(
      NULLIF(regexp_replace(order_number, '^MF\d{2,4}', ''), '')::bigint
    ),
    0
  )
  INTO v_max_seq
  FROM public.orders
  WHERE order_number ~ '^MF\d+$';

  IF v_max_seq > 0 THEN
    PERFORM setval('public.order_number_seq', v_max_seq, true);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Keep sequence default if legacy custom order_number formats exist
    NULL;
END $$;

CREATE OR REPLACE FUNCTION public.next_order_number(p_prefix text DEFAULT 'MF26')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq bigint;
  v_candidate text;
BEGIN
  LOOP
    v_seq := nextval('public.order_number_seq');
    v_candidate := p_prefix || lpad(v_seq::text, 3, '0');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.orders WHERE order_number = v_candidate
    );
  END LOOP;
  RETURN v_candidate;
END;
$$;

REVOKE ALL ON FUNCTION public.next_order_number(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_order_number(text) TO authenticated;

-- 2. Single-Query Atomic Batch Queue Reorder RPC
CREATE OR REPLACE FUNCTION public.reorder_orders_batch(p_ids text[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.orders AS o
  SET
    queue_order = u.ord::integer,
    updated_at = timezone('utc'::text, now())
  FROM unnest(p_ids) WITH ORDINALITY AS u(id, ord)
  WHERE o.id = u.id;
$$;

REVOKE ALL ON FUNCTION public.reorder_orders_batch(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_orders_batch(text[]) TO authenticated;

-- 3. Harden Table Row Level Security (Authenticated Workshop Staff Only)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_design_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capex_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;

-- Drop wide-open anon policies from initial bootstrap migrations
DROP POLICY IF EXISTS "Staff full access on orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated staff access on orders" ON public.orders;
CREATE POLICY "Authenticated staff access on orders"
  ON public.orders
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Staff full access on order_design_files" ON public.order_design_files;
DROP POLICY IF EXISTS "Authenticated staff access on order_design_files" ON public.order_design_files;
CREATE POLICY "Authenticated staff access on order_design_files"
  ON public.order_design_files
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Staff full access on capex_entries" ON public.capex_entries;
DROP POLICY IF EXISTS "Authenticated staff access on capex_entries" ON public.capex_entries;
CREATE POLICY "Authenticated staff access on capex_entries"
  ON public.capex_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Staff full access on raw_material_entries" ON public.raw_material_entries;
DROP POLICY IF EXISTS "Authenticated staff access on raw_material_entries" ON public.raw_material_entries;
CREATE POLICY "Authenticated staff access on raw_material_entries"
  ON public.raw_material_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow public access to product_catalog" ON public.product_catalog;
DROP POLICY IF EXISTS "Authenticated staff access on product_catalog" ON public.product_catalog;
CREATE POLICY "Authenticated staff access on product_catalog"
  ON public.product_catalog
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Harden Storage Policies on design-files Bucket
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'objects'
  ) THEN
    DROP POLICY IF EXISTS "Public Read Design Files" ON storage.objects;
    DROP POLICY IF EXISTS "Staff Insert Design Files" ON storage.objects;
    DROP POLICY IF EXISTS "Staff Delete Design Files" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Read Design Files" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Insert Design Files" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Delete Design Files" ON storage.objects;

    CREATE POLICY "Authenticated Read Design Files"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'design-files' AND auth.uid() IS NOT NULL);

    CREATE POLICY "Authenticated Insert Design Files"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'design-files' AND auth.uid() IS NOT NULL);

    CREATE POLICY "Authenticated Delete Design Files"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'design-files' AND auth.uid() IS NOT NULL);
  END IF;
END $$;
