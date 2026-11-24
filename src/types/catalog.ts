export type CatalogCategory =
  | 'Akrilik'
  | 'Apparel'
  | 'Lanyard'
  | 'Stiker UV'
  | 'Lainnya';

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  'Akrilik',
  'Apparel',
  'Lanyard',
  'Stiker UV',
  'Lainnya',
];

export interface CatalogItem {
  id: string;
  productName: string;
  category: CatalogCategory | string;
  defaultSpecs: string;
  defaultPricePerPcs: number;
  hppBahanBaku: number;
  hppTintaSablon: number;
  hppTenagaKerja: number;
  hppKemasan: number;
  hppOverhead: number;
  totalHppPerPcs: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCatalogItemInput {
  productName: string;
  category: CatalogCategory | string;
  defaultSpecs?: string;
  defaultPricePerPcs: number;
  hppBahanBaku: number;
  hppTintaSablon: number;
  hppTenagaKerja: number;
  hppKemasan: number;
  hppOverhead: number;
}

export type UpdateCatalogItemInput = Partial<CreateCatalogItemInput>;
