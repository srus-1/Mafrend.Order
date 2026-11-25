# Spec: Mafrend.Studio Workshop Management System

## Objective

Mafrend.Studio adalah aplikasi web operasional dan keuangan untuk workshop percetakan/merchandise custom (akrilik, apparel, lanyard, stiker UV, dll.). Aplikasi ini digunakan oleh pemilik workshop dan staf produksi untuk:

1. **Antrean Pesanan (`/order`)**: Mencatat pesanan masuk, mengatur prioritas antrean lewat drag-and-drop, melacak 6 tahap produksi (`ANTREAN`, `SETTING_DESAIN`, `PROSES_CETAK`, `FINISHING`, `SIAP_KIRIM`, `SELESAI`), memperbarui status pembayaran (`BELUM_LUNAS`, `DP`, `LUNAS`), mengelola berkas desain siap cetak, dan menghubungi pelanggan via WhatsApp.
2. **Katalog Item (`/catalog`)**: Menyimpan standar produk dan rincian 5 komponen HPP per pcs (Bahan Baku, Tinta/Sablon, Tenaga Kerja, Kemasan, Overhead) agar pengisian pesanan otomatis terisi dan margin terhitung akurat.
3. **Rekapan & Omzet (`/dashboard`)**: Memantau KPI omzet bruto, produksi (pcs), laba bersih, piutang DP, tren profit bulanan, serta ranking pelanggan berdasarkan omzet dan margin.
4. **Riwayat & Arsip (`/history`)**: Mengarsipkan dan mencari seluruh pesanan berstatus `SELESAI` per bulan beserta realisasi omzet, HPP, dan laba.
5. **Pengeluaran & Capex (`/capex`)**: Mencatat belanja modal (mesin, peralatan, renovasi) dan belanja bahan baku berulang per periode.
6. **Pelaporan & Utilitas**: Mengekspor data ke CSV (format ML), Excel asli (`.xlsx` via `exceljs`), dan PDF tema terang Mafrend.Studio, serta menyediakan kalkulator mengambang (`Alt+K`) dan toggle tema Light/Dark.

## Tech Stack

- **Framework**: Next.js `16.4.2` (App Router, `cacheComponents: true`)
- **UI Runtime**: React `19.3.0`, TypeScript `5`
- **Styling & Icons**: Tailwind CSS `4` (`@tailwindcss/turbopack`), `lucide-react` `1.61.0`
- **Drag & Drop**: `@dnd-kit/core` `6.3.1`, `@dnd-kit/sortable` `10.0.0`, `@dnd-kit/utilities` `3.2.2`
- **Database & Auth**: `@supabase/supabase-js` `2.118.0` (PostgreSQL + RLS + RPC, dengan fallback lokal/in-memory otomatis jika environment belum dikonfigurasi)
- **Export**: `exceljs` `4.4.0` (lazy-loaded melalui `await import('exceljs')`)
- **Tooling & Testing**: ESLint `9` (`eslint-config-next` `16.4.2`), `tsx` `4.23.15`, Node built-in test runner (`node:test`)

## Commands

```bash
# Development server (http://localhost:3000)
npm run dev

# Production build & start
npm run build
npm run start

# Static type checking (gunakan --incremental false di Windows untuk menghindari lock tsbuildinfo)
npx tsc --noEmit --incremental false

# Linting
npx eslint src

# Full automated test suite (5 suite, 157 test cases)
npx tsx tests/run_all.ts
```

## Project Structure

```text
src/
  app/                      # App Router pages (/order, /catalog, /dashboard, /history, /capex), layout.tsx, globals.css, icon.png
  components/
    auth/                   # StaffAuthModal.tsx (login staf Supabase Auth)
    capex/                  # CapexSpendingSections.tsx, CapexFormModal.tsx, RawMaterialFormModal.tsx
    dashboard/              # MetricCards.tsx, MonthlyProfitChart.tsx, BuyerProfitTable.tsx
    layout/                 # Sidebar.tsx (desktop rail & mobile topbar/drawer + dock Calculator & Theme Toggle)
    order/                  # OrderRowCard.tsx, OrderFilterTabs.tsx, OrderFormModal.tsx, OrderDesignDrawer.tsx, OrderSortableList.tsx
    shared/                 # CustomSelect.tsx, ActionMenuDropdown.tsx, ExportMenuButton.tsx, FloatingCalculator.tsx, LightboxModal.tsx, SetupNoticeBanner.tsx
  context/                  # OrderContext.tsx (optimistic CRUD & filter state), AuthContext.tsx, ThemeContext.tsx
  lib/
    services/               # client.ts, capexService.ts, catalogService.ts
    supabase.ts             # Service facade & orderService (<= 900 baris)
    utils.ts                # formatRp, formatDateShort, formatMonthLabel, calculateHPP, calculateMargin, buildWhatsAppUrl
    csvExport.ts            # Export CSV (ML) & PDF tema terang Mafrend.Studio
    excelExport.ts          # Export .xlsx asli via dynamic import('exceljs')
  types/                    # order.ts, capex.ts, catalog.ts
supabase/
  migrations/               # Migrasi SQL berurutan (schema awal, capex/materials, catalog, hardening RLS & RPC)
tests/
  run_all.ts                # Runner utama untuk 5 suite (e2e_suite, mobile_sidebar, r4_r5_verification, contrast_verification, catalog_calculator)
public/                     # Aset statis produksi (/logo-mafrend.png)
```

## Code Style

### Contoh Pola Komponen & Utilitas

```tsx
import { formatRp, buildWhatsAppUrl } from '@/lib/utils';
import ActionMenuDropdown from '@/components/shared/ActionMenuDropdown';

const PAYMENT_BADGE_CONFIG = {
  LUNAS: { label: 'Lunas', className: 'bg-[#6EEB9A] text-[#14161D]' },
  DP: { label: 'DP', className: 'bg-[#8EA6FF] text-[#14161D]' },
  BELUM_LUNAS: { label: 'Belum lunas', className: 'bg-[#F29B76] text-[#14161D]' },
} as const;

export function PaymentPill({ status }: { status: keyof typeof PAYMENT_BADGE_CONFIG }) {
  const badge = PAYMENT_BADGE_CONFIG[status] || PAYMENT_BADGE_CONFIG.BELUM_LUNAS;
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badge.className}`}>
      {badge.label}
    </span>
  );
}
```

### Konvensi Wajib

- **Zero Borders**: Jangan gunakan `border-*`, `divide-*`, atau `ring-*` pada container, baris, input, maupun modal. Pisahkan lapisan menggunakan permukaan tonal (`--bg-canvas`, `--bg-surface`, `--bg-row`, `--bg-chip-on-row`, `--shadow-card`).
- **Zero Sub-Headlines**: Header halaman dan section cukup satu baris bersih (`<h1>` satu kali per halaman, judul modal/drawer menggunakan `<h2>`).
- **Unified Controls**: Semua dropdown wajib memakai `CustomSelect` (dilarang native `<select>`). Menu aksi baris wajib memakai `ActionMenuDropdown` dengan trigger teks `⋯` tanpa ikon.
- **Responsive Fluid KPI**: Nilai KPI nominal uang wajib menggunakan tipografi fluid `clamp(...)` + `min-w-0` + `break-words` tanpa `truncate` agar angka jutaan hingga ratusan juta tidak meluber di kartu.
- **Tailwind v4 + Turbopack**: Jangan gunakan `:root:has(...)` di `src/app/globals.css`; gunakan `:root` dan `html.dark, html[data-theme="dark"]`.
- **React 19 + Next.js 16 Lint**: Jangan panggil `new Date()`, `Math.random()`, `window`, atau `localStorage` secara sinkron di dalam `useState(...)` initializer, dan jangan panggil `setState` sinkron di top-level `useEffect` (bungkus dalam fungsi `async` dengan guard `isMounted`).
- **Optimistic Concurrency**: Mutasi di `OrderContext.tsx` wajib menggunakan functional updater `setOrders((prev) => ...)` dan rollback per entitas lewat `ordersRef`.
- **Aksesibilitas (WCAG 2.1 AA)**: Rasio kontras minimal 4.5:1 (terverifikasi otomatis), `role="alert"` pada pesan error form, navigasi keyboard pada `CustomSelect` dan `ActionMenuDropdown`, serta tonal skeleton (`role="status" aria-busy="true"`) untuk state loading.

## Testing Strategy

- **Runner**: `npx tsx tests/run_all.ts` menggunakan `node:test` dan `node:assert/strict`.
- **Cakupan Saat Ini (157 test cases across 5 suites)**:
  1. `tests/e2e_suite.ts`: CRUD pesanan, kalkulasi HPP/margin/DP, filter/search, drag-reorder, upload berkas desain, agregasi dashboard, boundary & real-world scenarios.
  2. `tests/mobile_sidebar.test.ts`: Struktur responsif sidebar & navigasi mobile.
  3. `tests/r4_r5_verification.test.ts`: Guard arsitektur (batas ukuran file `supabase.ts` dan `capex/page.tsx` < 900 baris, integritas detail drawer `OrderRowCard.tsx`, migrasi SQL, export `.xlsx`/CSV/PDF).
  4. `tests/contrast_verification.test.ts`: Verifikasi rasio kontras WCAG 2.1 AA (27 pasangan warna Light, Dark, dan Kalkulator).
  5. `tests/catalog_calculator.test.ts`: CRUD `catalogService`, formatting kalkulator, dan branding Mafrend.Studio.
- **Aturan Penambahan Test**: Setiap fitur logika bisnis, kalkulasi finansial, export, atau bug fix wajib disertai test yang mereproduksi kasusnya sebelum atau bersamaan dengan implementasi.

## Boundaries

- **Always**:
  - Jalankan `npx tsc --noEmit --incremental false`, `npx eslint src`, dan `npx tsx tests/run_all.ts` sebelum commit.
  - Pertahankan class detail drawer di `OrderRowCard.tsx` (`md:grid-cols-12`, `md:col-span-7`, `md:col-span-5`, `Detail Pesanan`, `max-h-14 overflow-y-auto`, `break-words`).
  - Pertahankan `exceljs` sebagai dynamic import dan jaga `src/lib/supabase.ts` serta `src/app/capex/page.tsx` di bawah 900 baris.
  - Pertahankan fallback lokal/in-memory saat kredensial Supabase tidak tersedia.
- **Ask First**:
  - Perubahan skema database atau penambahan migrasi baru di `supabase/migrations/`.
  - Penambahan atau penghapusan dependency npm di `package.json`.
  - Perubahan kebijakan RLS/Auth Supabase atau arsitektur routing utama.
  - Push ke remote repository atau deployment ke produksi.
- **Never**:
  - Commit `.env.local`, kredensial, API key, atau file desain biner lokal (`mafrend-studio-redesign.figcraft`, `public/UI - Figcraft/`, `anti-slop/`, `public/referensi.png`, `public/CRM UI_UX design.jpg`).
  - Menggunakan native `<select>` atau menambahkan `border-*` / `divide-*` / `ring-*` pada UI container/baris/input.
  - Menghapus atau melemahkan test yang gagal tanpa persetujuan eksplisit.

## Success Criteria

1. Seluruh halaman utama (`/order`, `/catalog`, `/dashboard`, `/history`, `/capex`) merender bersih (`200 OK`) tanpa console error pada viewport mobile (320px/375px), tablet (768px), dan desktop (1024px/1440px).
2. `npx tsc --noEmit --incremental false` dan `npx eslint src` lolos dengan 0 error dan 0 warning.
3. `npx tsx tests/run_all.ts` lolos 100% (157/157 test atau lebih seiring penambahan fitur).
4. Export `.xlsx` (ExcelJS), `.csv` (ML), dan PDF menghasilkan berkas valid tanpa peringatan file korup.
5. Seluruh angka KPI nominal uang >= Rp 1.000.000 terbaca utuh di dalam kartu tanpa overflow atau terpotong.

## Open Questions

1. **Deployment & Environment Produksi**: Apakah target hosting produksi menggunakan Vercel, Cloudflare, atau VPS sendiri, dan apakah proyek Supabase produksi sudah menjalankan seluruh 4 file migrasi termasuk `20261125010000_hardening_rls_and_rpc.sql`?
2. **Akses Staf & Role**: Apakah ke depannya diperlukan pemisahan role (misalnya `owner` yang bisa melihat HPP/Laba/Capex vs `operator` produksi yang hanya melihat Antrean & Berkas Desain)?
3. **Prioritas Fitur Berikutnya**: Fitur apa yang ingin diprioritaskan pada iterasi selanjutnya setelah fondasi v1 ini (misalnya cetak nota/invoice pelanggan otomatis, pelacakan stok bahan baku otomatis saat pesanan dibuat, atau notifikasi reminder deadline)?
