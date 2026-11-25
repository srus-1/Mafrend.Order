'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useOrderUI } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';

const OrderFormModal = dynamic(
  () => import('@/components/order/OrderFormModal'),
  { ssr: false }
);
const OrderDesignDrawer = dynamic(
  () => import('@/components/order/OrderDesignDrawer'),
  { ssr: false }
);
const LightboxModal = dynamic(
  () => import('@/components/shared/LightboxModal'),
  { ssr: false }
);
const StaffAuthModal = dynamic(
  () => import('@/components/auth/StaffAuthModal'),
  { ssr: false }
);

export default function GlobalOverlays() {
  const { isFormModalOpen, activeDrawerOrder, lightboxFile } = useOrderUI();
  const { isAuthModalOpen } = useAuth();

  return (
    <>
      {isFormModalOpen && <OrderFormModal />}
      {activeDrawerOrder && <OrderDesignDrawer />}
      {lightboxFile && <LightboxModal />}
      {isAuthModalOpen && <StaffAuthModal />}
    </>
  );
}
