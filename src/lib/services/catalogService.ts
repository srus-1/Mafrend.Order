import {
  CatalogItem,
  CreateCatalogItemInput,
  UpdateCatalogItemInput,
} from '@/types/catalog';
import { supabase } from './client';

export interface DbCatalogRow {
  id: string;
  product_name: string;
  category: string;
  default_specs: string;
  default_price_per_pcs: number | string;
  hpp_bahan_baku: number | string;
  hpp_tinta_sablon: number | string;
  hpp_tenaga_kerja: number | string;
  hpp_kemasan: number | string;
  hpp_overhead: number | string;
  total_hpp_per_pcs: number | string;
  created_at: string;
  updated_at: string;
}

export function mapDbCatalogToDomain(row: DbCatalogRow): CatalogItem {
  const bahan = Math.max(0, Number(row.hpp_bahan_baku) || 0);
  const tinta = Math.max(0, Number(row.hpp_tinta_sablon) || 0);
  const kerja = Math.max(0, Number(row.hpp_tenaga_kerja) || 0);
  const kemas = Math.max(0, Number(row.hpp_kemasan) || 0);
  const oh = Math.max(0, Number(row.hpp_overhead) || 0);
  const computedTotal = bahan + tinta + kerja + kemas + oh;
  return {
    id: row.id,
    productName: row.product_name,
    category: row.category || 'Lainnya',
    defaultSpecs: row.default_specs || '',
    defaultPricePerPcs: Math.max(0, Number(row.default_price_per_pcs) || 0),
    hppBahanBaku: bahan,
    hppTintaSablon: tinta,
    hppTenagaKerja: kerja,
    hppKemasan: kemas,
    hppOverhead: oh,
    totalHppPerPcs: Number(row.total_hpp_per_pcs) || computedTotal,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const CATALOG_LOCAL_KEY = 'mafrend_product_catalog_v1';

const DEFAULT_CATALOG_ITEMS: CatalogItem[] = [
  {
    id: 'cat-1',
    productName: 'Ganci Akrilik 2 Sisi 5x5 cm',
    category: 'Akrilik',
    defaultSpecs: 'Akrilik 3mm, UV Print Bolak-Balik, Ring Putar',
    defaultPricePerPcs: 6500,
    hppBahanBaku: 1500,
    hppTintaSablon: 600,
    hppTenagaKerja: 700,
    hppKemasan: 300,
    hppOverhead: 200,
    totalHppPerPcs: 3300,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'cat-2',
    productName: 'Kaos Cotton Combed 24s Sablon',
    category: 'Apparel',
    defaultSpecs: 'Combed 24s Hitam/Putih, Plastisol A3 Depan Belakang',
    defaultPricePerPcs: 75000,
    hppBahanBaku: 36000,
    hppTintaSablon: 6500,
    hppTenagaKerja: 7000,
    hppKemasan: 2000,
    hppOverhead: 1500,
    totalHppPerPcs: 53000,
    createdAt: '2026-10-02T08:00:00.000Z',
    updatedAt: '2026-10-02T08:00:00.000Z',
  },
  {
    id: 'cat-3',
    productName: 'Lanyard Tissue 2cm Sublim 2 Sisi',
    category: 'Lanyard',
    defaultSpecs: 'Tissue Halus 2cm, Kait Kew-Kew + Stopper Hitam',
    defaultPricePerPcs: 15000,
    hppBahanBaku: 4200,
    hppTintaSablon: 1800,
    hppTenagaKerja: 1500,
    hppKemasan: 500,
    hppOverhead: 500,
    totalHppPerPcs: 8500,
    createdAt: '2026-10-03T08:00:00.000Z',
    updatedAt: '2026-10-03T08:00:00.000Z',
  },
  {
    id: 'cat-4',
    productName: 'Pin Akrilik Custom Peniti',
    category: 'Akrilik',
    defaultSpecs: 'Akrilik 2mm Cut Contour, UV High-Res, Peniti Besi',
    defaultPricePerPcs: 5000,
    hppBahanBaku: 1100,
    hppTintaSablon: 450,
    hppTenagaKerja: 500,
    hppKemasan: 250,
    hppOverhead: 200,
    totalHppPerPcs: 2500,
    createdAt: '2026-10-04T08:00:00.000Z',
    updatedAt: '2026-10-04T08:00:00.000Z',
  },
  {
    id: 'cat-5',
    productName: 'Stiker UV DTF Timbul A3+',
    category: 'Stiker UV',
    defaultSpecs: 'Lembar A3+ UV DTF Varnish Glossy Tahan Air',
    defaultPricePerPcs: 55000,
    hppBahanBaku: 16000,
    hppTintaSablon: 8500,
    hppTenagaKerja: 4000,
    hppKemasan: 1500,
    hppOverhead: 1500,
    totalHppPerPcs: 31500,
    createdAt: '2026-10-05T08:00:00.000Z',
    updatedAt: '2026-10-05T08:00:00.000Z',
  },
];

let inMemoryCatalogItems: CatalogItem[] = [...DEFAULT_CATALOG_ITEMS];

function readLocalCatalog(): CatalogItem[] {
  if (typeof window === 'undefined') return [...inMemoryCatalogItems];
  try {
    const raw = window.localStorage.getItem(CATALOG_LOCAL_KEY);
    if (!raw) {
      window.localStorage.setItem(CATALOG_LOCAL_KEY, JSON.stringify(inMemoryCatalogItems));
      return [...inMemoryCatalogItems];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      inMemoryCatalogItems = parsed;
      return [...parsed];
    }
  } catch {
    // Ignore storage read errors
  }
  return [...inMemoryCatalogItems];
}

function writeLocalCatalog(items: CatalogItem[]): void {
  inMemoryCatalogItems = [...items];
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CATALOG_LOCAL_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage write errors
    }
    window.dispatchEvent(new CustomEvent('mafrend:catalog-updated'));
  }
}

function buildCatalogDomainItem(
  id: string,
  input: CreateCatalogItemInput,
  createdAt: string,
  updatedAt: string
): CatalogItem {
  const hppBahanBaku = Math.max(0, Number(input.hppBahanBaku) || 0);
  const hppTintaSablon = Math.max(0, Number(input.hppTintaSablon) || 0);
  const hppTenagaKerja = Math.max(0, Number(input.hppTenagaKerja) || 0);
  const hppKemasan = Math.max(0, Number(input.hppKemasan) || 0);
  const hppOverhead = Math.max(0, Number(input.hppOverhead) || 0);
  const totalHppPerPcs =
    hppBahanBaku + hppTintaSablon + hppTenagaKerja + hppKemasan + hppOverhead;

  return {
    id,
    productName: input.productName.trim(),
    category: input.category || 'Lainnya',
    defaultSpecs: (input.defaultSpecs || '').trim(),
    defaultPricePerPcs: Math.max(0, Number(input.defaultPricePerPcs) || 0),
    hppBahanBaku,
    hppTintaSablon,
    hppTenagaKerja,
    hppKemasan,
    hppOverhead,
    totalHppPerPcs,
    createdAt,
    updatedAt,
  };
}

export const catalogService = {
  async getCatalogItems(): Promise<CatalogItem[]> {
    if (!supabase) {
      return readLocalCatalog();
    }

    try {
      const { data, error } = await supabase
        .from('product_catalog')
        .select('*')
        .order('product_name', { ascending: true })
        .limit(500);

      if (error) {
        return readLocalCatalog();
      }

      return (data as DbCatalogRow[]).map(mapDbCatalogToDomain);
    } catch {
      return readLocalCatalog();
    }
  },

  async createCatalogItem(input: CreateCatalogItemInput): Promise<CatalogItem> {
    const nowIso = new Date().toISOString();
    const localId = `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const domainItem = buildCatalogDomainItem(localId, input, nowIso, nowIso);

    if (!supabase) {
      const existing = readLocalCatalog();
      writeLocalCatalog([domainItem, ...existing]);
      return domainItem;
    }

    try {
      const payload = {
        product_name: domainItem.productName,
        category: domainItem.category,
        default_specs: domainItem.defaultSpecs,
        default_price_per_pcs: domainItem.defaultPricePerPcs,
        hpp_bahan_baku: domainItem.hppBahanBaku,
        hpp_tinta_sablon: domainItem.hppTintaSablon,
        hpp_tenaga_kerja: domainItem.hppTenagaKerja,
        hpp_kemasan: domainItem.hppKemasan,
        hpp_overhead: domainItem.hppOverhead,
        total_hpp_per_pcs: domainItem.totalHppPerPcs,
      };

      const { data, error } = await supabase
        .from('product_catalog')
        .insert(payload)
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Fallback catalog create');
      }

      const created = mapDbCatalogToDomain(data as DbCatalogRow);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mafrend:catalog-updated'));
      }
      return created;
    } catch {
      const existing = readLocalCatalog();
      writeLocalCatalog([domainItem, ...existing]);
      return domainItem;
    }
  },

  async updateCatalogItem(
    id: string,
    updates: UpdateCatalogItemInput
  ): Promise<CatalogItem | null> {
    const nowIso = new Date().toISOString();
    const applyUpdates = (current: CatalogItem): CatalogItem => {
      const merged: CreateCatalogItemInput = {
        productName:
          updates.productName !== undefined ? updates.productName : current.productName,
        category: updates.category !== undefined ? updates.category : current.category,
        defaultSpecs:
          updates.defaultSpecs !== undefined ? updates.defaultSpecs : current.defaultSpecs,
        defaultPricePerPcs:
          updates.defaultPricePerPcs !== undefined
            ? updates.defaultPricePerPcs
            : current.defaultPricePerPcs,
        hppBahanBaku:
          updates.hppBahanBaku !== undefined ? updates.hppBahanBaku : current.hppBahanBaku,
        hppTintaSablon:
          updates.hppTintaSablon !== undefined
            ? updates.hppTintaSablon
            : current.hppTintaSablon,
        hppTenagaKerja:
          updates.hppTenagaKerja !== undefined
            ? updates.hppTenagaKerja
            : current.hppTenagaKerja,
        hppKemasan:
          updates.hppKemasan !== undefined ? updates.hppKemasan : current.hppKemasan,
        hppOverhead:
          updates.hppOverhead !== undefined ? updates.hppOverhead : current.hppOverhead,
      };
      return buildCatalogDomainItem(current.id, merged, current.createdAt, nowIso);
    };

    const applyLocalFallback = (): CatalogItem | null => {
      const list = readLocalCatalog();
      const idx = list.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      const updated = applyUpdates(list[idx]);
      list[idx] = updated;
      writeLocalCatalog(list);
      return updated;
    };

    if (!supabase) {
      return applyLocalFallback();
    }

    try {
      const { data: existingRow } = await supabase
        .from('product_catalog')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!existingRow) {
        return applyLocalFallback();
      }

      const nextDomain = applyUpdates(mapDbCatalogToDomain(existingRow as DbCatalogRow));
      const { data, error } = await supabase
        .from('product_catalog')
        .update({
          product_name: nextDomain.productName,
          category: nextDomain.category,
          default_specs: nextDomain.defaultSpecs,
          default_price_per_pcs: nextDomain.defaultPricePerPcs,
          hpp_bahan_baku: nextDomain.hppBahanBaku,
          hpp_tinta_sablon: nextDomain.hppTintaSablon,
          hpp_tenaga_kerja: nextDomain.hppTenagaKerja,
          hpp_kemasan: nextDomain.hppKemasan,
          hpp_overhead: nextDomain.hppOverhead,
          total_hpp_per_pcs: nextDomain.totalHppPerPcs,
          updated_at: nowIso,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Fallback catalog update');
      }

      const saved = mapDbCatalogToDomain(data as DbCatalogRow);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mafrend:catalog-updated'));
      }
      return saved;
    } catch {
      return applyLocalFallback();
    }
  },

  async deleteCatalogItem(id: string): Promise<boolean> {
    if (!supabase) {
      const list = readLocalCatalog().filter((c) => c.id !== id);
      writeLocalCatalog(list);
      return true;
    }

    try {
      const { error } = await supabase.from('product_catalog').delete().eq('id', id);
      if (error) {
        const list = readLocalCatalog().filter((c) => c.id !== id);
        writeLocalCatalog(list);
        return true;
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mafrend:catalog-updated'));
      }
      return true;
    } catch {
      const list = readLocalCatalog().filter((c) => c.id !== id);
      writeLocalCatalog(list);
      return true;
    }
  },

  async upsertFromOrder(input: CreateCatalogItemInput): Promise<CatalogItem> {
    const items = await this.getCatalogItems();
    const normalized = input.productName.trim().toLowerCase();
    const match = items.find((c) => c.productName.trim().toLowerCase() === normalized);
    if (match) {
      const updated = await this.updateCatalogItem(match.id, input);
      if (updated) return updated;
    }
    return this.createCatalogItem(input);
  },
};
