import {
  CapexEntry,
  CreateCapexInput,
  RawMaterialEntry,
  CreateRawMaterialInput,
} from '@/types/capex';
import { supabase } from './client';

export interface DbCapexRow {
  id: string;
  item_name: string;
  category: string;
  amount: number | string;
  entry_date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function mapDbCapexToDomain(row: DbCapexRow): CapexEntry {
  return {
    id: row.id,
    itemName: row.item_name,
    category: row.category,
    amount: Number(row.amount) || 0,
    entryDate: row.entry_date,
    description: row.description || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface DbRawMaterialRow {
  id: string;
  material_name: string;
  category: string;
  supplier: string;
  quantity: number | string;
  unit: string;
  unit_price: number | string;
  total_amount: number | string;
  entry_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function mapDbRawMaterialToDomain(row: DbRawMaterialRow): RawMaterialEntry {
  const qty = Number(row.quantity) || 0;
  return {
    id: row.id,
    materialName: row.material_name,
    category: row.category,
    supplier: row.supplier,
    quantity: qty,
    qty: qty,
    unit: row.unit,
    unitPrice: Number(row.unit_price) || 0,
    totalAmount: Number(row.total_amount) || 0,
    entryDate: row.entry_date,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

let inMemoryCapexEntries: CapexEntry[] = [
  {
    id: 'cpx-1',
    itemName: 'Mesin Laser Cutting Acrylic 60W',
    category: 'Mesin & Peralatan',
    amount: 18500000,
    entryDate: '2026-10-02',
    description: 'Mesin potong akrilik workshop utama',
    createdAt: '2026-10-02T08:00:00.000Z',
    updatedAt: '2026-10-02T08:00:00.000Z',
  },
  {
    id: 'cpx-2',
    itemName: 'Komputer Desain Corel & Mockup',
    category: 'Elektronik & IT',
    amount: 8200000,
    entryDate: '2026-10-08',
    description: 'PC operasional setting desain',
    createdAt: '2026-10-08T09:30:00.000Z',
    updatedAt: '2026-10-08T09:30:00.000Z',
  },
  {
    id: 'cpx-3',
    itemName: 'Rak Pengering Sablon 50 Susun',
    category: 'Perlengkapan Workshop',
    amount: 2400000,
    entryDate: '2026-09-15',
    description: 'Rak pengering hasil cetak sablon',
    createdAt: '2026-09-15T11:00:00.000Z',
    updatedAt: '2026-09-15T11:00:00.000Z',
  },
  {
    id: 'cpx-4',
    itemName: 'Mesin Press Heat & Laminasi 38x38',
    category: 'Mesin & Peralatan',
    amount: 3750000,
    entryDate: '2026-08-20',
    description: 'Alat press gantungan kunci double sided',
    createdAt: '2026-08-20T14:15:00.000Z',
    updatedAt: '2026-08-20T14:15:00.000Z',
  },
];

let inMemoryRawMaterialEntries: RawMaterialEntry[] = [
  {
    id: 'mat-1',
    materialName: 'Lembaran Akrilik Bening 3mm (122x244cm)',
    category: 'Akrilik & Aksesoris',
    supplier: 'CV Akrilik Sentosa',
    quantity: 10,
    qty: 10,
    unit: 'lembar',
    unitPrice: 380000,
    totalAmount: 3800000,
    entryDate: '2026-10-04',
    notes: 'Bahan dasar gantungan kunci standard',
    createdAt: '2026-10-04T07:30:00.000Z',
    updatedAt: '2026-10-04T07:30:00.000Z',
  },
  {
    id: 'mat-2',
    materialName: 'Ring Gantungan Kunci Putar + Rantai',
    category: 'Akrilik & Aksesoris',
    supplier: 'Toko Aksesoris Jaya',
    quantity: 2000,
    qty: 2000,
    unit: 'pcs',
    unitPrice: 450,
    totalAmount: 900000,
    entryDate: '2026-10-06',
    notes: 'Gantungan kunci ring silver',
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z',
  },
  {
    id: 'mat-3',
    materialName: 'Tinta Sablon Plastisol Super White 1kg',
    category: 'Tinta & Sablon',
    supplier: 'Multi Screen Printing',
    quantity: 4,
    qty: 4,
    unit: 'kg',
    unitPrice: 175000,
    totalAmount: 700000,
    entryDate: '2026-10-12',
    notes: 'Tinta sablon dasar putih',
    createdAt: '2026-10-12T13:45:00.000Z',
    updatedAt: '2026-10-12T13:45:00.000Z',
  },
  {
    id: 'mat-4',
    materialName: 'Plastik OPP Seal 6x10cm + Hang Tag',
    category: 'Kemasan & Packaging',
    supplier: 'Mitra Packindo',
    quantity: 3000,
    qty: 3000,
    unit: 'pcs',
    unitPrice: 120,
    totalAmount: 360000,
    entryDate: '2026-09-18',
    notes: 'Kemasan plastik satuan souvenir',
    createdAt: '2026-09-18T09:00:00.000Z',
    updatedAt: '2026-09-18T09:00:00.000Z',
  },
  {
    id: 'mat-5',
    materialName: 'Mata Pisau Cutter Akrilik Olfa P-800',
    category: 'Sparepart & Consumable',
    supplier: 'Teknik Prima Tools',
    quantity: 5,
    qty: 5,
    unit: 'pack',
    unitPrice: 85000,
    totalAmount: 425000,
    entryDate: '2026-08-25',
    notes: 'Mata pisau potong cadangan',
    createdAt: '2026-08-25T15:20:00.000Z',
    updatedAt: '2026-08-25T15:20:00.000Z',
  },
];

export const capexService = {
  async getCapexEntries(): Promise<CapexEntry[]> {
    if (!supabase) {
      return [...inMemoryCapexEntries];
    }

    try {
      const { data, error } = await supabase
        .from('capex_entries')
        .select('*')
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.warn('Supabase capex_entries fallback to in-memory:', error.message || error);
        return [...inMemoryCapexEntries];
      }

      return (data as DbCapexRow[]).map(mapDbCapexToDomain);
    } catch (err) {
      console.warn('Unexpected error fetching capex entries (using in-memory fallback):', err);
      return [...inMemoryCapexEntries];
    }
  },

  async createCapexEntry(input: CreateCapexInput): Promise<CapexEntry> {
    const nowIso = new Date().toISOString();
    const safeAmount = Math.max(0, Number(input.amount) || 0);

    if (!supabase) {
      const newEntry: CapexEntry = {
        id: `cpx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        itemName: input.itemName.trim(),
        category: input.category,
        amount: safeAmount,
        entryDate: input.entryDate || nowIso.split('T')[0],
        description: input.description?.trim() || undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      inMemoryCapexEntries = [newEntry, ...inMemoryCapexEntries];
      return newEntry;
    }

    try {
      const payload = {
        item_name: input.itemName.trim(),
        category: input.category,
        amount: safeAmount,
        entry_date: input.entryDate || nowIso.split('T')[0],
        description: input.description?.trim() || null,
      };

      const { data, error } = await supabase
        .from('capex_entries')
        .insert(payload)
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Gagal menyimpan data capex');
      }

      return mapDbCapexToDomain(data as DbCapexRow);
    } catch (err) {
      console.warn('Supabase createCapexEntry fallback to in-memory:', err);
      const fallbackEntry: CapexEntry = {
        id: `cpx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        itemName: input.itemName.trim(),
        category: input.category,
        amount: safeAmount,
        entryDate: input.entryDate || nowIso.split('T')[0],
        description: input.description?.trim() || undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      inMemoryCapexEntries = [fallbackEntry, ...inMemoryCapexEntries];
      return fallbackEntry;
    }
  },

  async updateCapexEntry(
    id: string,
    updates: Partial<CreateCapexInput>
  ): Promise<CapexEntry | null> {
    const nowIso = new Date().toISOString();

    const applyInMemory = (): CapexEntry | null => {
      const index = inMemoryCapexEntries.findIndex((e) => e.id === id);
      if (index === -1) return null;

      const current = inMemoryCapexEntries[index];
      const updated: CapexEntry = {
        ...current,
        ...(updates.itemName !== undefined && { itemName: updates.itemName.trim() }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.amount !== undefined && { amount: Math.max(0, Number(updates.amount) || 0) }),
        ...(updates.entryDate !== undefined && { entryDate: updates.entryDate }),
        ...(updates.description !== undefined && {
          description: updates.description.trim() || undefined,
        }),
        updatedAt: nowIso,
      };
      inMemoryCapexEntries[index] = updated;
      return updated;
    };

    if (!supabase) {
      return applyInMemory();
    }

    try {
      const payload: Record<string, unknown> = {
        updated_at: nowIso,
      };
      if (updates.itemName !== undefined) payload.item_name = updates.itemName.trim();
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.amount !== undefined) payload.amount = Math.max(0, Number(updates.amount) || 0);
      if (updates.entryDate !== undefined) payload.entry_date = updates.entryDate;
      if (updates.description !== undefined) {
        payload.description = updates.description.trim() || null;
      }

      const { data, error } = await supabase
        .from('capex_entries')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Gagal memperbarui data capex');
      }

      return mapDbCapexToDomain(data as DbCapexRow);
    } catch (err) {
      console.warn('Supabase updateCapexEntry fallback to in-memory:', err);
      return applyInMemory();
    }
  },

  async deleteCapexEntry(id: string): Promise<boolean> {
    if (!supabase) {
      inMemoryCapexEntries = inMemoryCapexEntries.filter((e) => e.id !== id);
      return true;
    }

    try {
      const { error } = await supabase.from('capex_entries').delete().eq('id', id);

      if (error) {
        console.warn('Supabase deleteCapexEntry fallback to in-memory:', error.message || error);
        inMemoryCapexEntries = inMemoryCapexEntries.filter((e) => e.id !== id);
        return true;
      }
      return true;
    } catch (err) {
      console.warn('Unexpected error deleting capex entry (using in-memory fallback):', err);
      inMemoryCapexEntries = inMemoryCapexEntries.filter((e) => e.id !== id);
      return true;
    }
  },
};

export const rawMaterialService = {
  async getRawMaterialEntries(): Promise<RawMaterialEntry[]> {
    if (!supabase) {
      return [...inMemoryRawMaterialEntries];
    }

    try {
      const { data, error } = await supabase
        .from('raw_material_entries')
        .select('*')
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.warn(
          'Supabase raw_material_entries fallback to in-memory:',
          error.message || error
        );
        return [...inMemoryRawMaterialEntries];
      }

      return (data as DbRawMaterialRow[]).map(mapDbRawMaterialToDomain);
    } catch (err) {
      console.warn(
        'Unexpected error fetching raw material entries (using in-memory fallback):',
        err
      );
      return [...inMemoryRawMaterialEntries];
    }
  },

  async createRawMaterialEntry(input: CreateRawMaterialInput): Promise<RawMaterialEntry> {
    const nowIso = new Date().toISOString();
    const safeQty = Math.max(0.01, Number(input.quantity ?? input.qty) || 1);
    const safeUnitPrice = Math.max(0, Number(input.unitPrice) || 0);
    const calculatedTotal =
      input.totalAmount !== undefined
        ? Math.max(0, Number(input.totalAmount) || 0)
        : Math.round(safeQty * safeUnitPrice);

    const buildFallback = (): RawMaterialEntry => ({
      id: `mat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      materialName: input.materialName.trim(),
      category: input.category,
      supplier: input.supplier.trim(),
      quantity: safeQty,
      qty: safeQty,
      unit: input.unit.trim() || 'pcs',
      unitPrice: safeUnitPrice,
      totalAmount: calculatedTotal,
      entryDate: input.entryDate || nowIso.split('T')[0],
      notes: input.notes?.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    if (!supabase) {
      const newEntry = buildFallback();
      inMemoryRawMaterialEntries = [newEntry, ...inMemoryRawMaterialEntries];
      return newEntry;
    }

    try {
      const payload = {
        material_name: input.materialName.trim(),
        category: input.category,
        supplier: input.supplier.trim(),
        quantity: safeQty,
        unit: input.unit.trim() || 'pcs',
        unit_price: safeUnitPrice,
        total_amount: calculatedTotal,
        entry_date: input.entryDate || nowIso.split('T')[0],
        notes: input.notes?.trim() || null,
      };

      const { data, error } = await supabase
        .from('raw_material_entries')
        .insert(payload)
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Gagal menyimpan data bahan baku');
      }

      return mapDbRawMaterialToDomain(data as DbRawMaterialRow);
    } catch (err) {
      console.warn('Supabase createRawMaterialEntry fallback to in-memory:', err);
      const fallbackEntry = buildFallback();
      inMemoryRawMaterialEntries = [fallbackEntry, ...inMemoryRawMaterialEntries];
      return fallbackEntry;
    }
  },

  async updateRawMaterialEntry(
    id: string,
    updates: Partial<CreateRawMaterialInput>
  ): Promise<RawMaterialEntry | null> {
    const nowIso = new Date().toISOString();

    const applyInMemory = (): RawMaterialEntry | null => {
      const index = inMemoryRawMaterialEntries.findIndex((e) => e.id === id);
      if (index === -1) return null;

      const current = inMemoryRawMaterialEntries[index];
      const newQty =
        updates.quantity !== undefined
          ? Math.max(0.01, Number(updates.quantity) || 1)
          : current.quantity;
      const newUnitPrice =
        updates.unitPrice !== undefined
          ? Math.max(0, Number(updates.unitPrice) || 0)
          : current.unitPrice;
      const newTotal =
        updates.totalAmount !== undefined
          ? Math.max(0, Number(updates.totalAmount) || 0)
          : updates.quantity !== undefined || updates.unitPrice !== undefined
          ? Math.round(newQty * newUnitPrice)
          : current.totalAmount;

      const updated: RawMaterialEntry = {
        ...current,
        ...(updates.materialName !== undefined && { materialName: updates.materialName.trim() }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.supplier !== undefined && { supplier: updates.supplier.trim() }),
        quantity: newQty,
        qty: newQty,
        ...(updates.unit !== undefined && { unit: updates.unit.trim() || 'pcs' }),
        unitPrice: newUnitPrice,
        totalAmount: newTotal,
        ...(updates.entryDate !== undefined && { entryDate: updates.entryDate }),
        ...(updates.notes !== undefined && { notes: updates.notes.trim() || undefined }),
        updatedAt: nowIso,
      };
      inMemoryRawMaterialEntries[index] = updated;
      return updated;
    };

    if (!supabase) {
      return applyInMemory();
    }

    try {
      const { data: existingData } = await supabase
        .from('raw_material_entries')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      const curQty = existingData ? Number(existingData.quantity) || 1 : 1;
      const curPrice = existingData ? Number(existingData.unit_price) || 0 : 0;
      const newQty =
        updates.quantity !== undefined ? Math.max(0.01, Number(updates.quantity) || 1) : curQty;
      const newUnitPrice =
        updates.unitPrice !== undefined ? Math.max(0, Number(updates.unitPrice) || 0) : curPrice;
      const newTotal =
        updates.totalAmount !== undefined
          ? Math.max(0, Number(updates.totalAmount) || 0)
          : updates.quantity !== undefined || updates.unitPrice !== undefined
          ? Math.round(newQty * newUnitPrice)
          : existingData
          ? Number(existingData.total_amount) || 0
          : 0;

      const payload: Record<string, unknown> = {
        updated_at: nowIso,
        total_amount: newTotal,
      };
      if (updates.materialName !== undefined) payload.material_name = updates.materialName.trim();
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.supplier !== undefined) payload.supplier = updates.supplier.trim();
      if (updates.quantity !== undefined) payload.quantity = newQty;
      if (updates.unit !== undefined) payload.unit = updates.unit.trim() || 'pcs';
      if (updates.unitPrice !== undefined) payload.unit_price = newUnitPrice;
      if (updates.entryDate !== undefined) payload.entry_date = updates.entryDate;
      if (updates.notes !== undefined) payload.notes = updates.notes.trim() || null;

      const { data, error } = await supabase
        .from('raw_material_entries')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Gagal memperbarui data bahan baku');
      }

      return mapDbRawMaterialToDomain(data as DbRawMaterialRow);
    } catch (err) {
      console.warn('Supabase updateRawMaterialEntry fallback to in-memory:', err);
      return applyInMemory();
    }
  },

  async deleteRawMaterialEntry(id: string): Promise<boolean> {
    if (!supabase) {
      inMemoryRawMaterialEntries = inMemoryRawMaterialEntries.filter((e) => e.id !== id);
      return true;
    }

    try {
      const { error } = await supabase.from('raw_material_entries').delete().eq('id', id);

      if (error) {
        console.warn(
          'Supabase deleteRawMaterialEntry fallback to in-memory:',
          error.message || error
        );
        inMemoryRawMaterialEntries = inMemoryRawMaterialEntries.filter((e) => e.id !== id);
        return true;
      }
      return true;
    } catch (err) {
      console.warn('Unexpected error deleting raw material entry (using in-memory fallback):', err);
      inMemoryRawMaterialEntries = inMemoryRawMaterialEntries.filter((e) => e.id !== id);
      return true;
    }
  },
};
