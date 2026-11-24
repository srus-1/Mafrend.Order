'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Order } from '@/types/order';
import OrderRowCard from './OrderRowCard';
import { useOrders } from '@/context/OrderContext';
import { Inbox, Plus } from 'lucide-react';

interface SortableOrderItemProps {
  order: Order;
  index: number;
}

const SortableOrderItem = React.memo(
  function SortableOrderItem({ order, index }: SortableOrderItemProps) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: order.id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} className="touch-pan-y">
        <OrderRowCard
          order={order}
          index={index}
          isDragging={isDragging}
          dragHandleProps={{ ...attributes, ...listeners }}
        />
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.order === nextProps.order && prevProps.index === nextProps.index
);

interface OrderSortableListProps {
  orders: Order[];
}

export default function OrderSortableList({ orders }: OrderSortableListProps) {
  const { reorderQueue, openCreateModal } = useOrders();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = orders.findIndex((item) => item.id === active.id);
      const newIndex = orders.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(orders, oldIndex, newIndex);
        reorderQueue(newItems.map((item) => item.id));
      }
    },
    [orders, reorderQueue]
  );

  const orderIds = React.useMemo(() => orders.map((o) => o.id), [orders]);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-6 bg-[var(--bg-row)] rounded-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-[var(--bg-chip-on-row)] flex items-center justify-center text-[var(--ink-muted)] mb-3">
          <Inbox className="w-6 h-6 stroke-[1.6]" />
        </div>
        <h2 className="text-sm font-bold text-[var(--ink-primary)]">Antrean Kosong</h2>
        <p className="text-xs text-[var(--ink-muted)] max-w-xs mt-1 mb-4">
          Belum ada pesanan yang sesuai filter aktif.
        </p>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--cta-bg)] hover:bg-[var(--cta-hover)] text-[var(--cta-text)] text-xs font-semibold rounded-xl transition-colors min-h-[38px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Input pesanan</span>
        </button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2.5">
          {orders.map((order, index) => (
            <SortableOrderItem key={order.id} order={order} index={index} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
