// Programmatic WCAG 2.1 AA Contrast Verification Test
// Validates mathematical relative luminance and contrast ratios for Mafrend.Studio Light, Dark, Vivid Badges & Calculator.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

function sRGBtoLin(c: number): number {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
}

export function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((brighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export interface ColorPairCheck {
  id: string;
  name: string;
  foreground: string;
  background: string;
  minRatio: number;
  description: string;
}

export const DESIGN_SYSTEM_COLOR_PAIRS: ColorPairCheck[] = [
  // 1. Vivid Reference Palette & Primary CTAs
  {
    id: 'T1-CONTRAST-01',
    name: 'Electric Indigo Hero & Active Tab',
    foreground: '#FFFFFF',
    background: '#4638F5',
    minRatio: 4.5,
    description: 'White text on Electric Indigo hero KPI and active segmented tab',
  },
  {
    id: 'T1-CONTRAST-02',
    name: 'Obsidian Ink Primary CTA & Active Nav (Light)',
    foreground: '#FFFFFF',
    background: '#23252C',
    minRatio: 4.5,
    description: 'White text on Obsidian Ink primary button and active nav item',
  },
  {
    id: 'T1-CONTRAST-03',
    name: 'Vivid Emerald Mint Badge',
    foreground: '#14161D',
    background: '#6EEB9A',
    minRatio: 4.5,
    description: 'Deep ink on Vivid Emerald Mint status & margin pill',
  },
  {
    id: 'T1-CONTRAST-04',
    name: 'Vivid Terracotta Coral Badge',
    foreground: '#14161D',
    background: '#F29B76',
    minRatio: 4.5,
    description: 'Deep ink on Vivid Terracotta Coral status pill',
  },
  {
    id: 'T1-CONTRAST-05',
    name: 'Vivid Golden Amber Badge',
    foreground: '#14161D',
    background: '#F9DC7E',
    minRatio: 4.5,
    description: 'Deep ink on Vivid Golden Amber status pill',
  },
  {
    id: 'T1-CONTRAST-06',
    name: 'Vivid Periwinkle Badge',
    foreground: '#14161D',
    background: '#8EA6FF',
    minRatio: 4.5,
    description: 'Deep ink on Vivid Periwinkle status pill',
  },

  // 2. Light Mode Tonal Surface Hierarchy
  {
    id: 'T1-CONTRAST-07',
    name: 'Light Canvas Primary Ink',
    foreground: '#0F172A',
    background: '#EAEFF7',
    minRatio: 4.5,
    description: 'Page title ink on Light canvas',
  },
  {
    id: 'T1-CONTRAST-08',
    name: 'Light Surface Primary Ink',
    foreground: '#0F172A',
    background: '#FFFFFF',
    minRatio: 4.5,
    description: 'Primary ink on white container surface',
  },
  {
    id: 'T1-CONTRAST-09',
    name: 'Light Surface Secondary Ink',
    foreground: '#334155',
    background: '#FFFFFF',
    minRatio: 4.5,
    description: 'Secondary ink on white container surface',
  },
  {
    id: 'T1-CONTRAST-10',
    name: 'Light Surface Muted Ink',
    foreground: '#475569',
    background: '#FFFFFF',
    minRatio: 4.5,
    description: 'Muted label ink on white container surface',
  },
  {
    id: 'T1-CONTRAST-11',
    name: 'Light Row Card Primary Ink',
    foreground: '#0F172A',
    background: '#F1F4FA',
    minRatio: 4.5,
    description: 'Primary ink on separated Light row card',
  },
  {
    id: 'T1-CONTRAST-12',
    name: 'Light Row Card Muted Ink',
    foreground: '#475569',
    background: '#F1F4FA',
    minRatio: 4.5,
    description: 'Muted ink on separated Light row card',
  },
  {
    id: 'T1-CONTRAST-13',
    name: 'Light Input Subtle Muted Ink',
    foreground: '#475569',
    background: '#EEF2F8',
    minRatio: 4.5,
    description: 'Placeholder and muted text on Light subtle input surface',
  },
  {
    id: 'T1-CONTRAST-14',
    name: 'Light Profit Ink on Surface & Row',
    foreground: '#047857',
    background: '#F1F4FA',
    minRatio: 4.5,
    description: 'Positive profit value on Light row surface',
  },

  // 3. Dark Mode Tonal Surface Hierarchy
  {
    id: 'T1-CONTRAST-15',
    name: 'Dark Canvas Primary Ink',
    foreground: '#F8FAFC',
    background: '#0B0D13',
    minRatio: 4.5,
    description: 'Page title ink on Dark canvas',
  },
  {
    id: 'T1-CONTRAST-16',
    name: 'Dark Surface Primary Ink',
    foreground: '#F8FAFC',
    background: '#151822',
    minRatio: 4.5,
    description: 'Primary ink on Dark container surface',
  },
  {
    id: 'T1-CONTRAST-17',
    name: 'Dark Surface Secondary Ink',
    foreground: '#CBD5E1',
    background: '#151822',
    minRatio: 4.5,
    description: 'Secondary ink on Dark container surface',
  },
  {
    id: 'T1-CONTRAST-18',
    name: 'Dark Surface Muted Ink',
    foreground: '#94A3B8',
    background: '#151822',
    minRatio: 4.5,
    description: 'Muted label ink on Dark container surface',
  },
  {
    id: 'T1-CONTRAST-19',
    name: 'Dark Row Card Primary Ink',
    foreground: '#F8FAFC',
    background: '#1E2331',
    minRatio: 4.5,
    description: 'Primary ink on separated Dark row card',
  },
  {
    id: 'T1-CONTRAST-20',
    name: 'Dark Row Card Muted Ink',
    foreground: '#94A3B8',
    background: '#1E2331',
    minRatio: 4.5,
    description: 'Muted ink on separated Dark row card',
  },
  {
    id: 'T1-CONTRAST-21',
    name: 'Dark Subtle Input Muted Ink',
    foreground: '#94A3B8',
    background: '#272D3F',
    minRatio: 4.5,
    description: 'Placeholder and muted text on Dark subtle input surface',
  },
  {
    id: 'T1-CONTRAST-22',
    name: 'Dark Active Sidebar Nav',
    foreground: '#F8FAFC',
    background: '#2B3248',
    minRatio: 4.5,
    description: 'Active sidebar navigation item in Dark mode',
  },
  {
    id: 'T1-CONTRAST-23',
    name: 'Dark Profit Ink on Row',
    foreground: '#6EEB9A',
    background: '#1E2331',
    minRatio: 4.5,
    description: 'Positive profit value on Dark row surface',
  },

  // 4. Apple-Style Floating Calculator
  {
    id: 'T1-CONTRAST-24',
    name: 'Calculator Display Readout',
    foreground: '#FFFFFF',
    background: '#1C1C1E',
    minRatio: 4.5,
    description: 'White readout digits on Apple dark calculator chassis',
  },
  {
    id: 'T1-CONTRAST-25',
    name: 'Calculator Utility Buttons (AC, +/-, %)',
    foreground: '#0A0A0A',
    background: '#A5A5A5',
    minRatio: 4.5,
    description: 'Dark ink on light gray utility circle buttons',
  },
  {
    id: 'T1-CONTRAST-26',
    name: 'Calculator Number Buttons (0-9)',
    foreground: '#FFFFFF',
    background: '#333333',
    minRatio: 4.5,
    description: 'White digits on dark gray number circle buttons',
  },
  {
    id: 'T1-CONTRAST-27',
    name: 'Calculator Operator Buttons (+, -, ×, ÷, =)',
    foreground: '#0A0A0A',
    background: '#FF9F0A',
    minRatio: 4.5,
    description: 'High-contrast dark ink on Apple orange operator circle buttons',
  },
];

describe('WCAG 2.1 AA Contrast Verification Suite', () => {
  for (const pair of DESIGN_SYSTEM_COLOR_PAIRS) {
    test(`${pair.id}: ${pair.name} (${pair.foreground} on ${pair.background}) >= ${pair.minRatio}:1`, () => {
      const ratio = contrastRatio(pair.foreground, pair.background);
      assert.ok(
        ratio >= pair.minRatio,
        `Expected ${pair.foreground} on ${pair.background} (${pair.description}) to have contrast >= ${pair.minRatio}:1, got ${ratio}:1`
      );
    });
  }
});
