-- Migration: Create product_catalog table for Mafrend.Studio item & standard HPP presets
-- Enables instant HPP auto-fill inside OrderFormModal while preserving historical snapshots on orders

CREATE TABLE IF NOT EXISTS public.product_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  category text NOT NULL DEFAULT 'Akrilik',
  default_specs text NOT NULL DEFAULT '',
  default_price_per_pcs numeric NOT NULL DEFAULT 0 CHECK (default_price_per_pcs >= 0),
  hpp_bahan_baku numeric NOT NULL DEFAULT 0 CHECK (hpp_bahan_baku >= 0),
  hpp_tinta_sablon numeric NOT NULL DEFAULT 0 CHECK (hpp_tinta_sablon >= 0),
  hpp_tenaga_kerja numeric NOT NULL DEFAULT 0 CHECK (hpp_tenaga_kerja >= 0),
  hpp_kemasan numeric NOT NULL DEFAULT 0 CHECK (hpp_kemasan >= 0),
  hpp_overhead numeric NOT NULL DEFAULT 0 CHECK (hpp_overhead >= 0),
  total_hpp_per_pcs numeric NOT NULL DEFAULT 0 CHECK (total_hpp_per_pcs >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_catalog_category ON public.product_catalog (category);
CREATE INDEX IF NOT EXISTS idx_product_catalog_name ON public.product_catalog (product_name);

DROP TRIGGER IF EXISTS trigger_product_catalog_updated_at ON public.product_catalog;
CREATE TRIGGER trigger_product_catalog_updated_at
  BEFORE UPDATE ON public.product_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_catalog'
      AND policyname = 'Allow public access to product_catalog'
  ) THEN
    CREATE POLICY "Allow public access to product_catalog"
      ON public.product_catalog
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
