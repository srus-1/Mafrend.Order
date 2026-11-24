import {
  Order,
  CreateOrderInput,
  DesignFile,
  DashboardMetrics,
  MonthlyProfitData,
  BuyerSummary,
  ProcessStatus,
  PaymentStatus,
} from '@/types/order';
import { calculateHPP, calculateMargin } from './utils';
import {
  supabase,
  isSupabaseConfigured,
  getSupabaseConfigStatus,
  notifyIfAuthError,
} from './services/client';

export type { SupabaseConfigStatus } from './services/client';
export { supabase, isSupabaseConfigured, getSupabaseConfigStatus, notifyIfAuthError };
export * from './services/capexService';
export * from './services/catalogService';

export interface DbOrderRow {
  id: string;
  order_number: string;
  order_date: string;
  deadline: string;
  buyer_name: string;
  buyer_phone: string;
  product_name: string;
  specs: string;
  qty: number;
  price_per_pcs: number | string;
  omzet: number | string;
  hpp_bahan_baku: number | string;
  hpp_tinta_sablon: number | string;
  hpp_tenaga_kerja: number | string;
  hpp_kemasan: number | string;
  hpp_overhead: number | string;
  total_hpp_per_pcs: number | string;
  total_hpp: number | string;
  profit: number | string;
  margin_pct: number | string;
  payment_status: PaymentStatus;
  dp_amount: number | string;
  remaining_payment: number | string;
  process_status: ProcessStatus;
  queue_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_design_files?: DbDesignFileRow[];
  design_files?: DbDesignFileRow[];
}

export interface DbDesignFileRow {
  id: string;
  order_id: string;
  file_name: string;
  file_size: number | string;
  file_type: string;
  file_url: string;
  thumbnail_url: string | null;
  is_ready_to_print: boolean;
  uploaded_at: string;
}

export function mapDbDesignFileToDomain(row: DbDesignFileRow): DesignFile {
  return {
    id: row.id,
    orderId: row.order_id,
    fileName: row.file_name,
    fileSize: Number(row.file_size) || 0,
    fileType: row.file_type,
    fileUrl: row.file_url,
    thumbnailUrl: row.thumbnail_url || undefined,
    isReadyToPrint: Boolean(row.is_ready_to_print),
    uploadedAt: row.uploaded_at,
  };
}

export function mapDbOrderToDomain(row: DbOrderRow): Order {
  const rawFiles = row.order_design_files || row.design_files || [];
  return {
    id: row.id,
    orderNumber: row.order_number,
    orderDate: row.order_date,
    deadline: row.deadline,
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone,
    productName: row.product_name,
    specs: row.specs || '',
    qty: Number(row.qty) || 0,
    pricePerPcs: Number(row.price_per_pcs) || 0,
    omzet: Number(row.omzet) || 0,
    hppBreakdown: {
      bahanBaku: Number(row.hpp_bahan_baku) || 0,
      tintaSablon: Number(row.hpp_tinta_sablon) || 0,
      tenagaKerja: Number(row.hpp_tenaga_kerja) || 0,
      kemasan: Number(row.hpp_kemasan) || 0,
      overhead: Number(row.hpp_overhead) || 0,
      totalHppPerPcs: Number(row.total_hpp_per_pcs) || 0,
      totalHpp: Number(row.total_hpp) || 0,
    },
    profit: Number(row.profit) || 0,
    marginPct: Number(row.margin_pct) || 0,
    paymentStatus: row.payment_status,
    dpAmount: Number(row.dp_amount) || 0,
    remainingPayment: Number(row.remaining_payment) || 0,
    processStatus: row.process_status,
    queueOrder: Number(row.queue_order) || 0,
    designFiles: rawFiles.map(mapDbDesignFileToDomain),
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveNextOrderCodeAndQueue(
  prefix: string,
  year: number
): Promise<{ orderNumber: string; queueOrder: number }> {
  if (!supabase) {
    return {
      orderNumber: `${prefix}${String(Math.floor(Math.random() * 900) + 100)}`,
      queueOrder: 1,
    };
  }

  // Try atomic database sequence RPC first (from 20261125010000_hardening_rls_and_rpc.sql)
  const [rpcRes, topQueueRes] = await Promise.all([
    supabase.rpc('next_order_number', { p_prefix: prefix }),
    supabase
      .from('orders')
      .select('queue_order')
      .order('queue_order', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const maxQueue = Number(topQueueRes.data?.queue_order) || 0;
  if (!rpcRes.error && typeof rpcRes.data === 'string' && rpcRes.data.trim()) {
    return {
      orderNumber: rpcRes.data.trim(),
      queueOrder: maxQueue + 1,
    };
  }

  // Fallback when RPC migration has not been applied yet
  const { data: existingOrders } = await supabase
    .from('orders')
    .select('order_number, queue_order')
    .limit(1000);

  let maxSeq = 0;
  let fallbackMaxQueue = maxQueue;
  const existingNumbers = new Set<string>();

  (existingOrders || []).forEach(
    (row: { order_number?: string; queue_order?: number }) => {
      if (row.order_number) {
        existingNumbers.add(row.order_number);
        let seqPart = '';
        if (row.order_number.startsWith(prefix)) {
          seqPart = row.order_number.slice(prefix.length);
        } else if (row.order_number.startsWith(`MF${year}`)) {
          seqPart = row.order_number.slice(`MF${year}`.length);
        } else if (row.order_number.includes('-')) {
          seqPart = row.order_number.split('-').pop() || '';
        }
        const num = parseInt(seqPart, 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
      const q = Number(row.queue_order) || 0;
      if (q > fallbackMaxQueue) {
        fallbackMaxQueue = q;
      }
    }
  );

  let nextSeq = maxSeq + 1;
  let orderNumber = `${prefix}${String(nextSeq).padStart(3, '0')}`;
  while (existingNumbers.has(orderNumber)) {
    nextSeq++;
    orderNumber = `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  return {
    orderNumber,
    queueOrder: fallbackMaxQueue + 1,
  };
}

export const orderService = {
  /**
   * Fetches production orders sorted by queue order (bounded to 1000 rows).
   * Returns empty array `[]` cleanly when unconfigured or on error.
   */
  async getOrders(): Promise<Order[]> {
    if (!supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_design_files(*)')
        .order('queue_order', { ascending: true })
        .limit(1000);

      if (error) {
        notifyIfAuthError(error);
        console.error('Error fetching orders from Supabase:', error);
        return [];
      }

      return (data as DbOrderRow[]).map(mapDbOrderToDomain);
    } catch (err) {
      notifyIfAuthError(err);
      console.error('Unexpected error fetching orders:', err);
      return [];
    }
  },

  /**
   * Fetches a single order by ID with design files attached.
   */
  async getOrderById(id: string): Promise<Order | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_design_files(*)')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        if (error) {
          notifyIfAuthError(error);
          console.error('Error fetching order by ID:', error);
        }
        return null;
      }

      return mapDbOrderToDomain(data as DbOrderRow);
    } catch (err) {
      notifyIfAuthError(err);
      console.error('Unexpected error in getOrderById:', err);
      return null;
    }
  },

  /**
   * Creates a new production order with atomic sequence generation, HPP, and profit margins.
   * Automatically retries on unique order_number collision (23505).
   */
  async createOrder(newOrderData: CreateOrderInput): Promise<Order> {
    const safeQty = Math.max(1, newOrderData.qty || 1);
    const safePrice = Math.max(0, newOrderData.pricePerPcs || 0);
    const calculatedHpp = calculateHPP(newOrderData.hppBreakdown, safeQty);
    const omzet = safeQty * safePrice;
    const { profit, marginPct } = calculateMargin(omzet, calculatedHpp.totalHpp);

    let dpAmount = newOrderData.dpAmount || 0;
    let remainingPayment = 0;
    if (newOrderData.paymentStatus === 'LUNAS') {
      dpAmount = omzet;
      remainingPayment = 0;
    } else if (newOrderData.paymentStatus === 'DP') {
      remainingPayment = Math.max(0, omzet - dpAmount);
    } else {
      dpAmount = 0;
      remainingPayment = omzet;
    }

    const now = new Date();
    const year = now.getFullYear();
    const shortYear = String(year).slice(-2);
    const prefix = `MF${shortYear}`;

    if (!supabase) {
      return {
        id: `ord-${Date.now()}`,
        orderNumber: `${prefix}${String(Math.floor(Math.random() * 900) + 100)}`,
        orderDate: newOrderData.orderDate || now.toISOString().split('T')[0],
        deadline: newOrderData.deadline,
        buyerName: newOrderData.buyerName,
        buyerPhone: newOrderData.buyerPhone,
        productName: newOrderData.productName,
        specs: newOrderData.specs || '',
        qty: safeQty,
        pricePerPcs: safePrice,
        omzet,
        hppBreakdown: calculatedHpp,
        profit,
        marginPct,
        paymentStatus: newOrderData.paymentStatus,
        dpAmount,
        remainingPayment,
        processStatus: newOrderData.processStatus,
        queueOrder: 1,
        designFiles: [],
        notes: newOrderData.notes,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
    }

    const maxAttempts = 3;
    let lastError: unknown = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { orderNumber, queueOrder } = await resolveNextOrderCodeAndQueue(prefix, year);

      const dbPayload = {
        order_number: orderNumber,
        order_date: newOrderData.orderDate || now.toISOString().split('T')[0],
        deadline: newOrderData.deadline,
        buyer_name: newOrderData.buyerName,
        buyer_phone: newOrderData.buyerPhone,
        product_name: newOrderData.productName,
        specs: newOrderData.specs || '',
        qty: safeQty,
        price_per_pcs: safePrice,
        omzet,
        hpp_bahan_baku: calculatedHpp.bahanBaku,
        hpp_tinta_sablon: calculatedHpp.tintaSablon,
        hpp_tenaga_kerja: calculatedHpp.tenagaKerja,
        hpp_kemasan: calculatedHpp.kemasan,
        hpp_overhead: calculatedHpp.overhead,
        total_hpp_per_pcs: calculatedHpp.totalHppPerPcs,
        total_hpp: calculatedHpp.totalHpp,
        profit,
        margin_pct: marginPct,
        payment_status: newOrderData.paymentStatus,
        dp_amount: dpAmount,
        remaining_payment: remainingPayment,
        process_status: newOrderData.processStatus,
        queue_order: queueOrder,
        notes: newOrderData.notes || null,
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(dbPayload)
        .select('*, order_design_files(*)')
        .single();

      if (!error && data) {
        return mapDbOrderToDomain(data as DbOrderRow);
      }

      lastError = error;
      // Retry only on unique_violation (23505) for order_number race conditions
      if ((error as { code?: string } | null)?.code === '23505' && attempt < maxAttempts - 1) {
        continue;
      }

      notifyIfAuthError(error);
      console.error('Error inserting order into Supabase:', error);
      throw error;
    }

    throw lastError || new Error('Gagal membuat nomor pesanan unik.');
  },

  /**
   * Updates an existing order, recalculating financials if quantity, price, or HPP changed.
   */
  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    if (!supabase) return null;

    const existing = await this.getOrderById(id);
    if (!existing) return null;

    const qty = updates.qty !== undefined ? updates.qty : existing.qty;
    const pricePerPcs =
      updates.pricePerPcs !== undefined ? updates.pricePerPcs : existing.pricePerPcs;
    const omzet = qty * pricePerPcs;

    let hppBreakdown = existing.hppBreakdown;
    if (updates.hppBreakdown) {
      hppBreakdown = calculateHPP(updates.hppBreakdown, qty);
    } else if (updates.qty !== undefined) {
      hppBreakdown = calculateHPP(existing.hppBreakdown, qty);
    }

    const { profit, marginPct } = calculateMargin(omzet, hppBreakdown.totalHpp);
    const paymentStatus = updates.paymentStatus || existing.paymentStatus;
    let dpAmount =
      updates.dpAmount !== undefined ? updates.dpAmount : existing.dpAmount;
    let remainingPayment = 0;

    if (paymentStatus === 'LUNAS') {
      dpAmount = omzet;
      remainingPayment = 0;
    } else if (paymentStatus === 'DP') {
      remainingPayment = Math.max(0, omzet - dpAmount);
    } else {
      dpAmount = 0;
      remainingPayment = omzet;
    }

    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      qty,
      price_per_pcs: pricePerPcs,
      omzet,
      hpp_bahan_baku: hppBreakdown.bahanBaku,
      hpp_tinta_sablon: hppBreakdown.tintaSablon,
      hpp_tenaga_kerja: hppBreakdown.tenagaKerja,
      hpp_kemasan: hppBreakdown.kemasan,
      hpp_overhead: hppBreakdown.overhead,
      total_hpp_per_pcs: hppBreakdown.totalHppPerPcs,
      total_hpp: hppBreakdown.totalHpp,
      profit,
      margin_pct: marginPct,
      payment_status: paymentStatus,
      dp_amount: dpAmount,
      remaining_payment: remainingPayment,
    };

    if (updates.buyerName !== undefined) dbUpdates.buyer_name = updates.buyerName;
    if (updates.buyerPhone !== undefined) dbUpdates.buyer_phone = updates.buyerPhone;
    if (updates.productName !== undefined) dbUpdates.product_name = updates.productName;
    if (updates.specs !== undefined) dbUpdates.specs = updates.specs;
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
    if (updates.orderDate !== undefined) dbUpdates.order_date = updates.orderDate;
    if (updates.processStatus !== undefined) dbUpdates.process_status = updates.processStatus;
    if (updates.queueOrder !== undefined) dbUpdates.queue_order = updates.queueOrder;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { data, error } = await supabase
      .from('orders')
      .update(dbUpdates)
      .eq('id', id)
      .select('*, order_design_files(*)')
      .single();

    if (error) {
      notifyIfAuthError(error);
      console.error('Error updating order in Supabase:', error);
      throw error;
    }

    return mapDbOrderToDomain(data as DbOrderRow);
  },

  /**
   * Deletes an order; attached design files are deleted via CASCADE in DB.
   */
  async deleteOrder(id: string): Promise<boolean> {
    if (!supabase) return true;

    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      notifyIfAuthError(error);
      console.error('Error deleting order in Supabase:', error);
      throw error;
    }
    return true;
  },

  /**
   * Updates queue_order sequence atomically via batch RPC, falling back to verified updates.
   */
  async reorderOrders(orderedIds: string[]): Promise<void> {
    if (!supabase || orderedIds.length === 0) return;

    const { error: rpcError } = await supabase.rpc('reorder_orders_batch', {
      p_ids: orderedIds,
    });

    if (!rpcError) {
      return;
    }

    // Fallback when RPC migration has not been applied yet
    const results = await Promise.all(
      orderedIds.map((id, index) =>
        supabase!
          .from('orders')
          .update({ queue_order: index + 1 })
          .eq('id', id)
      )
    );

    const firstFailed = results.find((r) => r.error)?.error;
    if (firstFailed) {
      notifyIfAuthError(firstFailed);
      console.error('Error reordering orders in Supabase:', firstFailed);
      throw firstFailed;
    }
  },

  /**
   * Reorder alias for backward compatibility.
   */
  async reorderQueue(orderedIds: string[]): Promise<void> {
    return this.reorderOrders(orderedIds);
  },

  /**
   * Uploads artwork file to Supabase Storage and records metadata in database.
   */
  async uploadDesignFile(orderId: string, file: File): Promise<DesignFile> {
    if (!supabase) {
      throw new Error('Supabase client is not initialized.');
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `orders/${orderId}/${Date.now()}_${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from('design-files')
      .upload(storagePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      notifyIfAuthError(uploadError);
      console.error('Error uploading to Supabase Storage:', uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('design-files')
      .getPublicUrl(storagePath);

    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
    const isImage = ['PNG', 'JPG', 'JPEG', 'WEBP'].includes(ext);

    const designFileRecord = {
      order_id: orderId,
      file_name: file.name,
      file_size: file.size,
      file_type: ext,
      file_url: urlData.publicUrl,
      thumbnail_url: isImage ? urlData.publicUrl : null,
      is_ready_to_print: false,
    };

    const { data, error: dbError } = await supabase
      .from('order_design_files')
      .insert(designFileRecord)
      .select()
      .single();

    if (dbError) {
      notifyIfAuthError(dbError);
      console.error('Error inserting design file record:', dbError);
      throw dbError;
    }

    return mapDbDesignFileToDomain(data as DbDesignFileRow);
  },

  /**
   * Directly attaches an already constructed DesignFile record into database.
   */
  async addDesignFile(orderId: string, file: DesignFile): Promise<DesignFile> {
    if (!supabase) return file;

    const { data, error } = await supabase
      .from('order_design_files')
      .insert({
        id: file.id,
        order_id: orderId,
        file_name: file.fileName,
        file_size: file.fileSize,
        file_type: file.fileType,
        file_url: file.fileUrl,
        thumbnail_url: file.thumbnailUrl || null,
        is_ready_to_print: file.isReadyToPrint,
      })
      .select()
      .single();

    if (error) {
      notifyIfAuthError(error);
      console.error('Error adding design file:', error);
      throw error;
    }

    return mapDbDesignFileToDomain(data as DbDesignFileRow);
  },

  /**
   * Toggles operator print-readiness flag for an artwork file.
   */
  async toggleDesignReady(
    orderId: string,
    fileId: string,
    isReady?: boolean
  ): Promise<boolean> {
    if (!supabase) return true;

    let targetReady = isReady;
    if (targetReady === undefined) {
      const { data } = await supabase
        .from('order_design_files')
        .select('is_ready_to_print')
        .eq('id', fileId)
        .maybeSingle();

      targetReady = !data?.is_ready_to_print;
    }

    const { error } = await supabase
      .from('order_design_files')
      .update({ is_ready_to_print: targetReady })
      .eq('id', fileId);

    if (error) {
      notifyIfAuthError(error);
      console.error('Error toggling design ready status:', error);
      throw error;
    }

    return true;
  },

  /**
   * Deletes artwork file record from database and cleans up Supabase storage.
   */
  async deleteDesignFile(orderId: string, fileId: string): Promise<boolean> {
    if (!supabase) return true;

    const { data: fileRecord } = await supabase
      .from('order_design_files')
      .select('file_url')
      .eq('id', fileId)
      .maybeSingle();

    if (fileRecord?.file_url) {
      try {
        const urlParts = fileRecord.file_url.split('/design-files/');
        if (urlParts.length > 1) {
          const filePath = decodeURIComponent(urlParts[1]);
          await supabase.storage.from('design-files').remove([filePath]);
        }
      } catch (storageErr) {
        console.warn('Could not remove file from storage bucket:', storageErr);
      }
    }

    const { error } = await supabase
      .from('order_design_files')
      .delete()
      .eq('id', fileId);

    if (error) {
      notifyIfAuthError(error);
      console.error('Error deleting design file record:', error);
      throw error;
    }

    return true;
  },

  getDashboardMetrics(orders: Order[]): DashboardMetrics {
    let totalPcs = 0;
    let totalOmzet = 0;
    let totalProfit = 0;
    let totalHpp = 0;
    let totalPiutangDp = 0;
    let activeOrdersCount = 0;
    let completedOrdersCount = 0;

    orders.forEach((o) => {
      totalPcs += o.qty;
      totalOmzet += o.omzet;
      totalProfit += o.profit;
      totalHpp += o.hppBreakdown.totalHpp;
      totalPiutangDp += o.remainingPayment;

      if (o.processStatus === 'SELESAI') {
        completedOrdersCount++;
      } else {
        activeOrdersCount++;
      }
    });

    const averageMarginPct =
      totalOmzet > 0
        ? Math.round(((totalProfit / totalOmzet) * 100) * 10) / 10
        : 0;

    return {
      totalPcs,
      totalOmzet,
      totalProfit,
      totalHpp,
      totalPiutangDp,
      activeOrdersCount,
      completedOrdersCount,
      averageMarginPct,
    };
  },

  getMonthlyProfitData(orders: Order[]): MonthlyProfitData[] {
    const monthMap = new Map<
      string,
      { omzet: number; hpp: number; profit: number; pcs: number; label: string }
    >();

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];

    orders.forEach((o) => {
      const date = new Date(o.orderDate || o.createdAt);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      const curr = monthMap.get(key) || {
        omzet: 0,
        hpp: 0,
        profit: 0,
        pcs: 0,
        label,
      };
      curr.omzet += o.omzet;
      curr.hpp += o.hppBreakdown.totalHpp;
      curr.profit += o.profit;
      curr.pcs += o.qty;
      monthMap.set(key, curr);
    });

    const result: MonthlyProfitData[] = [];
    const sortedKeys = Array.from(monthMap.keys()).sort();

    sortedKeys.forEach((key) => {
      const val = monthMap.get(key)!;
      const marginPct =
        val.omzet > 0
          ? Math.round(((val.profit / val.omzet) * 100) * 10) / 10
          : 0;

      result.push({
        month: key,
        monthLabel: val.label,
        omzet: val.omzet,
        hpp: val.hpp,
        profit: val.profit,
        marginPct,
        pcs: val.pcs,
      });
    });

    return result;
  },

  getBuyerSummaries(orders: Order[]): BuyerSummary[] {
    const map = new Map<string, BuyerSummary>();

    orders.forEach((o) => {
      const key = o.buyerName.trim().toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.totalOrders += 1;
        existing.totalPcs += o.qty;
        existing.totalOmzet += o.omzet;
        existing.totalHpp += o.hppBreakdown.totalHpp;
        existing.totalProfit += o.profit;
      } else {
        map.set(key, {
          buyerName: o.buyerName,
          buyerPhone: o.buyerPhone,
          totalOrders: 1,
          totalPcs: o.qty,
          totalOmzet: o.omzet,
          totalHpp: o.hppBreakdown.totalHpp,
          totalProfit: o.profit,
          marginPct: 0,
        });
      }
    });

    const list = Array.from(map.values()).map((b) => {
      const marginPct =
        b.totalOmzet > 0
          ? Math.round(((b.totalProfit / b.totalOmzet) * 100) * 10) / 10
          : 0;
      return {
        ...b,
        marginPct,
      };
    });

    list.sort((a, b) => b.totalProfit - a.totalProfit);

    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  },
};
