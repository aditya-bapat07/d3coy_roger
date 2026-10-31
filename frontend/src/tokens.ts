/**
 * Vidura Design Tokens — analyst light theme.
 * The same values are mirrored as CSS custom properties in index.css
 * (for Tailwind classes) and used directly here (for Cytoscape styles).
 */

export const TOKENS = {
  // Background
  bgPrimary: '#FAFBFC',
  bgSecondary: '#F1F3F5',
  bgElevated: '#FFFFFF',
  bgGraph: '#F8F9FA',

  // Text
  textPrimary: '#1A1D21',
  textSecondary: '#5E6C84',
  textTertiary: '#8993A4',

  // Risk palette
  riskCritical: '#D32029',
  riskHigh: '#E8590C',
  riskMedium: '#E8A817',
  riskLow: '#2B8A3E',
  riskMinimal: '#868E96',

  // Accent
  accentPrimary: '#1864AB',
  accentHover: '#1971C2',
  borderDefault: '#DEE2E6',
  borderSubtle: '#E9ECEF',

  // Graph-specific
  edgeExploit: '#D32029',
  edgeCredential: '#E8590C',
  edgeControls: '#1864AB',
  edgeDependency: '#868E96',
  edgeHighlighted: '#1864AB',
  nodeStroke: '#495057',
  nodeSelected: '#1864AB',

  // Typography
  fontSans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
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
