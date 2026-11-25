'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  Order,
  CreateOrderInput,
  DesignFile,
  FilterTab,
  DashboardMetrics,
  MonthlyProfitData,
  BuyerSummary,
  ProcessStatus,
  PaymentStatus,
} from '@/types/order';
import {
  orderService,
  isSupabaseConfigured,
  getSupabaseConfigStatus,
} from '@/lib/supabase';
import { calculateHPP, calculateMargin } from '@/lib/utils';

/**
 * Timezone-safe month extraction helper using string slicing (YYYY-MM).
 * Avoids UTC date drift inherent in `new Date(dateStr).getMonth()`.
 */
export function getOrderMonth(
  orderOrDate?: { orderDate?: string; createdAt?: string } | string | null
): string {
  if (!orderOrDate) return '';
  const raw =
    typeof orderOrDate === 'string'
      ? orderOrDate.trim()
      : (orderOrDate.orderDate || orderOrDate.createdAt || '').trim();

  if (!raw) return '';
  if (raw.length >= 7 && /^\d{4}-\d{2}/.test(raw)) {
    return raw.slice(0, 7);
  }
  if (raw.length >= 7 && /^\d{4}\/\d{2}/.test(raw)) {
    return raw.slice(0, 7).replace('/', '-');
  }
  return '';
}

export interface OrderDataContextType {
  orders: Order[];
  loading: boolean;
  createOrder: (orderData: CreateOrderInput) => Promise<Order>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<Order | null>;
  deleteOrder: (id: string) => Promise<boolean>;
  updateProcessStatus: (id: string, status: ProcessStatus) => Promise<void>;
  updatePaymentStatus: (id: string, status: PaymentStatus) => Promise<void>;
  reorderQueue: (orderedIds: string[]) => Promise<void>;
  addDesignFile: (orderId: string, file: DesignFile) => Promise<DesignFile | null>;
  uploadDesignFile: (orderId: string, file: File) => Promise<DesignFile | null>;
  toggleDesignReady: (orderId: string, designId: string) => Promise<boolean>;
  deleteDesignFile: (orderId: string, designId: string) => Promise<boolean>;
  isConfigured: boolean;
  configReason?: string;
  error: string | null;
  clearError: () => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  availableMonths: string[];
}

export interface OrderUIContextType {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterTab: FilterTab;
  setFilterTab: (tab: FilterTab) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
  isFormModalOpen: boolean;
  setIsFormModalOpen: (open: boolean) => void;
  editingOrder: Order | null;
  setEditingOrder: (order: Order | null) => void;
  openCreateModal: () => void;
  openEditModal: (order: Order) => void;
  activeDrawerOrder: Order | null;
  setActiveDrawerOrder: (order: Order | null) => void;
  lightboxFile: DesignFile | null;
  setLightboxFile: (file: DesignFile | null) => void;
  selectedOrderIds: string[];
  toggleSelectOrder: (orderId: string) => void;
  selectAllOrders: (orderIds: string[]) => void;
  clearSelectedOrders: () => void;
}

export interface DashboardAnalytics {
  metrics: DashboardMetrics;
  monthlyProfit: MonthlyProfitData[];
  buyerSummaries: BuyerSummary[];
}

export type OrderContextType = OrderDataContextType & OrderUIContextType & DashboardAnalytics;

const OrderDataContext = createContext<OrderDataContextType | undefined>(undefined);
const OrderUIContext = createContext<OrderUIContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const ordersRef = useRef<Order[]>(orders);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [activeDrawerOrderId, setActiveDrawerOrderId] = useState<string | null>(null);
  const [lightboxFile, setLightboxFile] = useState<DesignFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonthState, setSelectedMonthState] = useState<string>('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const clearError = useCallback(() => setError(null), []);

  const setSelectedMonth = useCallback((month: string) => {
    setSelectedMonthState(month);
  }, []);

  const toggleSelectOrder = useCallback((orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  }, []);

  const selectAllOrders = useCallback((orderIds: string[]) => {
    setSelectedOrderIds(Array.from(new Set(orderIds)));
  }, []);

  const clearSelectedOrders = useCallback(() => {
    setSelectedOrderIds([]);
  }, []);

  const configStatus = useMemo(() => {
    if (typeof getSupabaseConfigStatus === 'function') {
      return getSupabaseConfigStatus();
    }
    return {
      isConfigured: Boolean(isSupabaseConfigured),
      reason: isSupabaseConfigured
        ? undefined
        : 'Supabase belum dikonfigurasi di environment variables.',
    };
  }, []);

  // Initial load + reload on auth session change
  useEffect(() => {
    let isMounted = true;

    async function loadInitialOrders() {
      try {
        if (!configStatus.isConfigured) {
          if (isMounted) {
            setOrders([]);
            setLoading(false);
          }
          return;
        }

        const data = await Promise.resolve(orderService.getOrders());
        if (isMounted) {
          setOrders(data || []);
        }
      } catch (err) {
        console.error('Failed to load initial orders:', err);
        if (isMounted) {
          setOrders([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadInitialOrders();

    const handleAuthChange = () => {
      if (isMounted) {
        void loadInitialOrders();
      }
    };
    window.addEventListener('mafrend:auth-changed', handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener('mafrend:auth-changed', handleAuthChange);
    };
  }, [configStatus.isConfigured]);

  const activeDrawerOrder = useMemo(() => {
    if (!activeDrawerOrderId) return null;
    return orders.find((o) => o.id === activeDrawerOrderId) ?? null;
  }, [orders, activeDrawerOrderId]);

  const setActiveDrawerOrder = useCallback((order: Order | null) => {
    setActiveDrawerOrderId(order ? order.id : null);
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingOrder(null);
    setIsFormModalOpen(true);
  }, []);

  const openEditModal = useCallback((order: Order) => {
    setEditingOrder(order);
    setIsFormModalOpen(true);
  }, []);

  // Concurrent-safe optimistic mutations using functional state updaters + per-entity rollbacks

  const handleCreateOrder = useCallback(
    async (orderData: CreateOrderInput): Promise<Order> => {
      const now = new Date();
      const safeQty = Math.max(1, orderData.qty || 1);
      const safePrice = Math.max(0, orderData.pricePerPcs || 0);
      const calculatedHpp = calculateHPP(orderData.hppBreakdown, safeQty);
      const omzet = safeQty * safePrice;
      const { profit, marginPct } = calculateMargin(omzet, calculatedHpp.totalHpp);

      let dpAmount = orderData.dpAmount || 0;
      let remainingPayment = 0;
      if (orderData.paymentStatus === 'LUNAS') {
        dpAmount = omzet;
        remainingPayment = 0;
      } else if (orderData.paymentStatus === 'DP') {
        remainingPayment = Math.max(0, omzet - dpAmount);
      } else {
        dpAmount = 0;
        remainingPayment = omzet;
      }

      const tempId = `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const shortYear = String(now.getFullYear()).slice(-2);
      const seqHint = ordersRef.current.length + 1;
      const optimisticOrder: Order = {
        id: tempId,
        orderNumber: `MF${shortYear}${String(seqHint).padStart(3, '0')}`,
        orderDate: orderData.orderDate || now.toISOString().split('T')[0],
        deadline: orderData.deadline,
        buyerName: orderData.buyerName,
        buyerPhone: orderData.buyerPhone,
        productName: orderData.productName,
        specs: orderData.specs || '',
        qty: safeQty,
        pricePerPcs: safePrice,
        omzet,
        hppBreakdown: calculatedHpp,
        profit,
        marginPct,
        paymentStatus: orderData.paymentStatus,
        dpAmount,
        remainingPayment,
        processStatus: orderData.processStatus,
        queueOrder: 1,
        designFiles: orderData.designFiles || [],
        notes: orderData.notes,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      setOrders((prev) => [
        optimisticOrder,
        ...prev.map((o) => ({
          ...o,
          queueOrder: (o.queueOrder || 0) + 1,
        })),
      ]);

      try {
        const committed = await Promise.resolve(orderService.createOrder(orderData));
        setOrders((prev) => prev.map((o) => (o.id === tempId ? committed : o)));
        return committed;
      } catch (err: unknown) {
        setOrders((prev) =>
          prev
            .filter((o) => o.id !== tempId)
            .map((o) => ({
              ...o,
              queueOrder: Math.max(1, (o.queueOrder || 1) - 1),
            }))
        );
        const msg = err instanceof Error ? err.message : 'Gagal membuat pesanan baru.';
        setError(`Gagal membuat pesanan. ${msg}`);
        throw err;
      }
    },
    []
  );

  const handleUpdateOrder = useCallback(
    async (id: string, updates: Partial<Order>): Promise<Order | null> => {
      const targetSnapshot = ordersRef.current.find((o) => o.id === id);
      if (!targetSnapshot) return null;

      const computeUpdatedOrder = (base: Order): Order => {
        const qty = updates.qty !== undefined ? updates.qty : base.qty;
        const pricePerPcs =
          updates.pricePerPcs !== undefined ? updates.pricePerPcs : base.pricePerPcs;
        const omzet = qty * pricePerPcs;

        let hppBreakdown = base.hppBreakdown;
        if (updates.hppBreakdown) {
          hppBreakdown = calculateHPP(updates.hppBreakdown, qty);
        } else if (updates.qty !== undefined) {
          hppBreakdown = calculateHPP(base.hppBreakdown, qty);
        }

        const { profit, marginPct } = calculateMargin(omzet, hppBreakdown.totalHpp);
        const paymentStatus = updates.paymentStatus || base.paymentStatus;
        let dpAmount =
          updates.dpAmount !== undefined ? updates.dpAmount : base.dpAmount;
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

        return {
          ...base,
          ...updates,
          qty,
          pricePerPcs,
          omzet,
          hppBreakdown,
          profit,
          marginPct,
          paymentStatus,
          dpAmount,
          remainingPayment,
          updatedAt: new Date().toISOString(),
        };
      };

      const optimisticUpdated = computeUpdatedOrder(targetSnapshot);

      setOrders((prev) =>
        prev.map((o) => (o.id === id ? computeUpdatedOrder(o) : o))
      );

      try {
        const remote = await Promise.resolve(orderService.updateOrder(id, updates));
        if (remote) {
          setOrders((prev) => prev.map((o) => (o.id === id ? remote : o)));
          return remote;
        }
        return optimisticUpdated;
      } catch (err: unknown) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? targetSnapshot : o))
        );
        const msg = err instanceof Error ? err.message : 'Gagal memperbarui pesanan.';
        setError(`Gagal memperbarui pesanan. ${msg}`);
        throw err;
      }
    },
    []
  );

  const handleDeleteOrder = useCallback(async (id: string): Promise<boolean> => {
    const currentList = ordersRef.current;
    const deletedIndex = currentList.findIndex((o) => o.id === id);
    const deletedSnapshot = deletedIndex >= 0 ? currentList[deletedIndex] : null;

    setActiveDrawerOrderId((prevId) => (prevId === id ? null : prevId));
    setSelectedOrderIds((prev) => prev.filter((orderId) => orderId !== id));
    setOrders((prev) => prev.filter((o) => o.id !== id));

    try {
      const success = await Promise.resolve(orderService.deleteOrder(id));
      return success;
    } catch (err: unknown) {
      if (deletedSnapshot) {
        setOrders((prev) => {
          if (prev.some((o) => o.id === id)) return prev;
          const restored = [...prev];
          const insertIdx =
            deletedIndex >= 0 ? Math.min(deletedIndex, restored.length) : 0;
          restored.splice(insertIdx, 0, deletedSnapshot);
          return restored;
        });
      }
      const msg = err instanceof Error ? err.message : 'Gagal menghapus pesanan.';
      setError(`Gagal menghapus pesanan. ${msg}`);
      throw err;
    }
  }, []);

  const handleUpdateProcessStatus = useCallback(
    async (id: string, status: ProcessStatus): Promise<void> => {
      await handleUpdateOrder(id, { processStatus: status });
    },
    [handleUpdateOrder]
  );

  const handleUpdatePaymentStatus = useCallback(
    async (id: string, status: PaymentStatus): Promise<void> => {
      await handleUpdateOrder(id, { paymentStatus: status });
    },
    [handleUpdateOrder]
  );

  const handleReorderQueue = useCallback(async (orderedIds: string[]): Promise<void> => {
    const prevPositions = new Map(
      ordersRef.current.map((o, idx) => [o.id, { queueOrder: o.queueOrder, idx }])
    );

    const idMap = new Map<string, number>();
    orderedIds.forEach((id, index) => {
      idMap.set(id, index + 1);
    });

    setOrders((prev) =>
      [...prev]
        .sort((a, b) => (idMap.get(a.id) ?? 9999) - (idMap.get(b.id) ?? 9999))
        .map((item, idx) => ({
          ...item,
          queueOrder: idx + 1,
        }))
    );

    try {
      await Promise.resolve(orderService.reorderQueue(orderedIds));
    } catch (err: unknown) {
      setOrders((prev) =>
        [...prev]
          .map((o) => {
            const saved = prevPositions.get(o.id);
            return saved ? { ...o, queueOrder: saved.queueOrder } : o;
          })
          .sort((a, b) => {
            const idxA = prevPositions.get(a.id)?.idx ?? -1;
            const idxB = prevPositions.get(b.id)?.idx ?? -1;
            return idxA - idxB;
          })
      );
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan urutan antrean.';
      setError(`Gagal menyimpan urutan antrean. ${msg}`);
      throw err;
    }
  }, []);

  const handleAddDesignFile = useCallback(
    async (orderId: string, file: DesignFile): Promise<DesignFile | null> => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, designFiles: [...(o.designFiles || []), file] }
            : o
        )
      );

      try {
        const remote = await Promise.resolve(orderService.addDesignFile(orderId, file));
        if (remote) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    designFiles: o.designFiles.map((f) =>
                      f.id === file.id ? remote : f
                    ),
                  }
                : o
            )
          );
          return remote;
        }
        return file;
      } catch (err: unknown) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  designFiles: o.designFiles.filter((f) => f.id !== file.id),
                }
              : o
          )
        );
        const msg = err instanceof Error ? err.message : 'Gagal menambahkan file desain.';
        setError(`Gagal menambahkan file desain. ${msg}`);
        throw err;
      }
    },
    []
  );

  const handleUploadDesignFile = useCallback(
    async (orderId: string, file: File): Promise<DesignFile | null> => {
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      const fileUrl = URL.createObjectURL(file);
      const tempFile: DesignFile = {
        id: `df-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        orderId,
        fileName: file.name,
        fileSize: file.size,
        fileType: ext,
        fileUrl,
        thumbnailUrl: ['PNG', 'JPG', 'JPEG', 'WEBP'].includes(ext) ? fileUrl : undefined,
        isReadyToPrint: false,
        uploadedAt: new Date().toISOString(),
      };

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, designFiles: [...(o.designFiles || []), tempFile] }
            : o
        )
      );

      try {
        if (configStatus.isConfigured && typeof orderService.uploadDesignFile === 'function') {
          const remote = await orderService.uploadDesignFile(orderId, file);
          URL.revokeObjectURL(fileUrl);
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    designFiles: o.designFiles.map((f) =>
                      f.id === tempFile.id ? remote : f
                    ),
                  }
                : o
            )
          );
          return remote;
        }
        return tempFile;
      } catch (err: unknown) {
        URL.revokeObjectURL(fileUrl);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  designFiles: o.designFiles.filter((f) => f.id !== tempFile.id),
                }
              : o
          )
        );
        const msg = err instanceof Error ? err.message : 'Gagal mengunggah file desain.';
        setError(`Gagal mengunggah file desain. ${msg}`);
        throw err;
      }
    },
    [configStatus.isConfigured]
  );

  const handleToggleDesignReady = useCallback(
    async (orderId: string, designId: string): Promise<boolean> => {
      const targetOrder = ordersRef.current.find((o) => o.id === orderId);
      const previousReady = targetOrder?.designFiles.find(
        (f) => f.id === designId
      )?.isReadyToPrint;
      const nextReady = !previousReady;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                designFiles: o.designFiles.map((f) =>
                  f.id === designId ? { ...f, isReadyToPrint: nextReady } : f
                ),
              }
            : o
        )
      );

      try {
        const success = await Promise.resolve(
          orderService.toggleDesignReady(orderId, designId, nextReady)
        );
        return success;
      } catch (err: unknown) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  designFiles: o.designFiles.map((f) =>
                    f.id === designId
                      ? { ...f, isReadyToPrint: Boolean(previousReady) }
                      : f
                  ),
                }
              : o
          )
        );
        const msg =
          err instanceof Error
            ? err.message
            : 'Gagal memperbarui status file siap cetak.';
        setError(`Gagal memperbarui status file cetak. ${msg}`);
        throw err;
      }
    },
    []
  );

  const handleDeleteDesignFile = useCallback(
    async (orderId: string, designId: string): Promise<boolean> => {
      const targetOrder = ordersRef.current.find((o) => o.id === orderId);
      const fileIndex =
        targetOrder?.designFiles.findIndex((f) => f.id === designId) ?? -1;
      const deletedFile =
        fileIndex >= 0 && targetOrder ? targetOrder.designFiles[fileIndex] : null;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                designFiles: o.designFiles.filter((f) => f.id !== designId),
              }
            : o
        )
      );

      try {
        const success = await Promise.resolve(
          orderService.deleteDesignFile(orderId, designId)
        );
        return success;
      } catch (err: unknown) {
        if (deletedFile) {
          setOrders((prev) =>
            prev.map((o) => {
              if (o.id !== orderId) return o;
              if (o.designFiles.some((f) => f.id === designId)) return o;
              const nextFiles = [...o.designFiles];
              const idx =
                fileIndex >= 0 ? Math.min(fileIndex, nextFiles.length) : nextFiles.length;
              nextFiles.splice(idx, 0, deletedFile);
              return { ...o, designFiles: nextFiles };
            })
          );
        }
        const msg = err instanceof Error ? err.message : 'Gagal menghapus file desain.';
        setError(`Gagal menghapus file desain. ${msg}`);
        throw err;
      }
    },
    []
  );

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      const m = getOrderMonth(o);
      if (m) set.add(m);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [orders]);

  const [clientCurrentMonth, setClientCurrentMonth] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function initMonth() {
      await Promise.resolve();
      if (!isMounted) return;
      const now = new Date();
      setClientCurrentMonth(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      );
    }
    void initMonth();
    return () => {
      isMounted = false;
    };
  }, []);

  const defaultMonth = useMemo(() => {
    if (clientCurrentMonth && availableMonths.includes(clientCurrentMonth)) {
      return clientCurrentMonth;
    }
    if (availableMonths.length > 0) {
      return availableMonths[0];
    }
    return clientCurrentMonth;
  }, [availableMonths, clientCurrentMonth]);

  const selectedMonth = selectedMonthState || defaultMonth;

  const dataContextValue = useMemo<OrderDataContextType>(
    () => ({
      orders,
      loading,
      createOrder: handleCreateOrder,
      updateOrder: handleUpdateOrder,
      deleteOrder: handleDeleteOrder,
      updateProcessStatus: handleUpdateProcessStatus,
      updatePaymentStatus: handleUpdatePaymentStatus,
      reorderQueue: handleReorderQueue,
      addDesignFile: handleAddDesignFile,
      uploadDesignFile: handleUploadDesignFile,
      toggleDesignReady: handleToggleDesignReady,
      deleteDesignFile: handleDeleteDesignFile,
      isConfigured: configStatus.isConfigured,
      configReason: configStatus.reason,
      error,
      clearError,
      selectedMonth,
      setSelectedMonth,
      availableMonths,
    }),
    [
      orders,
      loading,
      handleCreateOrder,
      handleUpdateOrder,
      handleDeleteOrder,
      handleUpdateProcessStatus,
      handleUpdatePaymentStatus,
      handleReorderQueue,
      handleAddDesignFile,
      handleUploadDesignFile,
      handleToggleDesignReady,
      handleDeleteDesignFile,
      configStatus.isConfigured,
      configStatus.reason,
      error,
      clearError,
      selectedMonth,
      setSelectedMonth,
      availableMonths,
    ]
  );

  const uiContextValue = useMemo<OrderUIContextType>(
    () => ({
      searchQuery,
      setSearchQuery,
      filterTab,
      setFilterTab,
      dateFilter,
      setDateFilter,
      isFormModalOpen,
      setIsFormModalOpen,
      editingOrder,
      setEditingOrder,
      openCreateModal,
      openEditModal,
      activeDrawerOrder,
      setActiveDrawerOrder,
      lightboxFile,
      setLightboxFile,
      selectedOrderIds,
      toggleSelectOrder,
      selectAllOrders,
      clearSelectedOrders,
    }),
    [
      searchQuery,
      filterTab,
      dateFilter,
      isFormModalOpen,
      editingOrder,
      openCreateModal,
      openEditModal,
      activeDrawerOrder,
      setActiveDrawerOrder,
      lightboxFile,
      selectedOrderIds,
      toggleSelectOrder,
      selectAllOrders,
      clearSelectedOrders,
    ]
  );

  return (
    <OrderDataContext.Provider value={dataContextValue}>
      <OrderUIContext.Provider value={uiContextValue}>
        {children}
      </OrderUIContext.Provider>
    </OrderDataContext.Provider>
  );
}

export function useOrderData(): OrderDataContextType {
  const context = useContext(OrderDataContext);
  if (!context) {
    throw new Error('useOrderData must be used within an OrderProvider');
  }
  return context;
}

export function useOrderUI(): OrderUIContextType {
  const context = useContext(OrderUIContext);
  if (!context) {
    throw new Error('useOrderUI must be used within an OrderProvider');
  }
  return context;
}

export function useDashboardAnalytics(): DashboardAnalytics {
  const { orders, selectedMonth } = useOrderData();
  const { selectedOrderIds } = useOrderUI();

  const activeOrdersForDashboard = useMemo(() => {
    if (selectedOrderIds.length > 0) {
      const selectedSet = new Set(selectedOrderIds);
      return orders.filter((o) => selectedSet.has(o.id));
    }
    return orders.filter((o) => getOrderMonth(o) === selectedMonth);
  }, [orders, selectedOrderIds, selectedMonth]);

  const metrics = useMemo(
    () => orderService.getDashboardMetrics(activeOrdersForDashboard),
    [activeOrdersForDashboard]
  );
  const monthlyProfit = useMemo(
    () => orderService.getMonthlyProfitData(orders),
    [orders]
  );
  const buyerSummaries = useMemo(
    () => orderService.getBuyerSummaries(activeOrdersForDashboard),
    [activeOrdersForDashboard]
  );

  return useMemo(
    () => ({ metrics, monthlyProfit, buyerSummaries }),
    [metrics, monthlyProfit, buyerSummaries]
  );
}

export function useOrders(): OrderContextType {
  const data = useOrderData();
  const ui = useOrderUI();
  const analytics = useDashboardAnalytics();
  return useMemo(() => ({ ...data, ...ui, ...analytics }), [data, ui, analytics]);
}
