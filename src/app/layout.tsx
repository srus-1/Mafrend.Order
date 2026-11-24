import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import SetupNoticeBanner from '@/components/shared/SetupNoticeBanner';
import FloatingCalculator from '@/components/shared/FloatingCalculator';
import StaffAuthModal from '@/components/auth/StaffAuthModal';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { CalculatorProvider } from '@/context/CalculatorContext';
import { OrderProvider } from '@/context/OrderContext';
import { SidebarProvider } from '@/context/SidebarContext';
import OrderFormModal from '@/components/order/OrderFormModal';
import OrderDesignDrawer from '@/components/order/OrderDesignDrawer';
import LightboxModal from '@/components/shared/LightboxModal';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mafrend.Studio',
  description:
    'Manajemen Produksi Sablon & Merchandise Custom, Standar Katalog HPP, dan Analitik Keuangan Mafrend.Studio',
};

const themeInitScript = `try{var s=localStorage.getItem("color-scheme");var m=document.querySelector('meta[name="color-scheme"]');if(m)m.content=(s==="light"||s==="dark")?s:"light dark";var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light");document.documentElement.classList.toggle("dark",d);}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased bg-[var(--bg-canvas)] text-[var(--ink-primary)] min-h-screen flex font-sans">
        <ThemeProvider>
          <AuthProvider>
            <CalculatorProvider>
              <OrderProvider>
                <Suspense fallback={null}>
                  <SidebarProvider>
                    <Sidebar />

                    <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden bg-[var(--bg-canvas)]">
                      <SetupNoticeBanner />
                      <TopHeader />

                      <main className="flex-1 p-3 sm:p-6 md:p-7 max-w-[1400px] w-full mx-auto">
                        {children}
                      </main>
                    </div>

                    <OrderFormModal />
                    <OrderDesignDrawer />
                    <LightboxModal />
                    <FloatingCalculator />
                    <StaffAuthModal />
                  </SidebarProvider>
                </Suspense>
              </OrderProvider>
            </CalculatorProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
