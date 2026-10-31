/**
 * Vidura Design Tokens — Cybrix dark-orange theme.
 * Centralized design tokens: CSS custom properties are mirrored in index.css
 * and Tailwind config, and used directly here for Cytoscape styles.
 */

export const TOKENS = {
  // Background surfaces
  bgPrimary: '#0A0706',
  bgSecondary: '#120D0B',
  bgElevated: '#18120F',
  bgGraph: '#0D0907',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A09A96',
  textTertiary: '#6F6863',

  // Risk palette (re-tuned for dark)
  riskCritical: '#FF4D4F',
  riskHigh: '#FF7A2B',
  riskMedium: '#FFC24B',
  riskLow: '#3DDC97',
  riskMinimal: '#6F6863',

  // Accent & Borders
  accentPrimary: '#F26A1B',
  accentHover: '#FF7A2B',
  accentGradient: 'linear-gradient(135deg, #F26A1B 0%, #FF7A2B 100%)',
  borderDefault: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  borderHover: 'rgba(242, 106, 27, 0.5)',

  // Crown Jewel badge
  crownJewel: '#FFB340',

  // Floating Nav tokens
  navBg: 'rgba(255, 255, 255, 0.05)',
  navBgScrolled: 'rgba(255, 255, 255, 0.08)',
  navBorder: 'rgba(255, 255, 255, 0.10)',
  navShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
  navGlow: '0 0 40px rgba(242, 106, 27, 0.08)',

  // Graph-specific
  edgeExploit: '#FF5A5F',
  edgeCredential: '#FFA24A',
  edgeControls: '#5B9BFF', // Kept cool for contrast at ~70% opacity
  edgeDependency: '#6B6560',
  edgeHighlighted: '#FF7A2B',
  nodeStroke: 'rgba(255, 255, 255, 0.2)',
  nodeSelected: '#FF7A2B',

  // Typography
  fontSans: "'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

export type RiskBandKey = 'critical' | 'high' | 'medium' | 'low' | 'minimal';

export interface RiskBand {
  key: RiskBandKey;
  label: string;
  min: number;
  color: string;
}

/** 5-stop display palette (score bands 80/60/40/20). */
export const RISK_BANDS: RiskBand[] = [
  { key: 'critical', label: 'Critical', min: 80, color: TOKENS.riskCritical },
  { key: 'high', label: 'High', min: 60, color: TOKENS.riskHigh },
  { key: 'medium', label: 'Medium', min: 40, color: TOKENS.riskMedium },
  { key: 'low', label: 'Low', min: 20, color: TOKENS.riskLow },
  { key: 'minimal', label: 'Minimal', min: 0, color: TOKENS.riskMinimal },
];

export function getRiskBand(score: number): RiskBand {
  return RISK_BANDS.find((b) => score >= b.min) ?? RISK_BANDS[RISK_BANDS.length - 1];
}

export function getRiskColor(score: number): string {
  return getRiskBand(score).color;
}

/** Human-readable Purdue zone labels. */
export const PURDUE_LABELS: Record<string, string> = {
  INTERNET: 'Internet',
  L4: 'IT · Level 4',
  'L3.5': 'DMZ · Level 3.5',
  L3: 'OT · Level 3',
  L2: 'OT · Level 2',
  L1: 'OT · Level 1',
  L0: 'OT · Level 0',
  SERVICES: 'City services',
};

export function purdueLabel(level: string): string {
  return PURDUE_LABELS[level] ?? level;
}
