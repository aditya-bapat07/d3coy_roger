/**
 * CASCADE Design Tokens
 * Control room dark theme & unified 0-100 risk color scale.
 */

export const THEME_COLORS = {
  background: '#0A0E17',
  surface: '#111827',
  card: '#162032',
  cardHover: '#1C293F',
  border: '#23324A',
  text: '#F1F5F9',
  subtle: '#64748B',
} as const;

export const RISK_SCALE = {
  low: {
    min: 0,
    max: 25,
    color: '#10B981',
    bgColor: '#064E3B',
    borderColor: '#047857',
    label: 'Low',
  },
  medium: {
    min: 26,
    max: 50,
    color: '#F59E0B',
    bgColor: '#78350F',
    borderColor: '#B45309',
    label: 'Medium',
  },
  high: {
    min: 51,
    max: 75,
    color: '#EF4444',
    bgColor: '#7F1D1D',
    borderColor: '#B91C1C',
    label: 'High',
  },
  critical: {
    min: 76,
    max: 100,
    color: '#991B1B',
    bgColor: '#450A0A',
    borderColor: '#7F1D1D',
    label: 'Critical',
  },
} as const;

export const PURDUE_ZONE_COLORS = {
  INTERNET: '#6B7280',
  L4: '#3B82F6',
  'L3.5': '#8B5CF6',
  L3: '#06B6D4',
  L2: '#F59E0B',
  L1: '#EC4899',
  L0: '#10B981',
} as const;

/**
 * Returns the exact color code for a risk score between 0 and 100.
 */
export function getRiskColor(score: number): string {
  if (score <= 25) return RISK_SCALE.low.color;
  if (score <= 50) return RISK_SCALE.medium.color;
  if (score <= 75) return RISK_SCALE.high.color;
  return RISK_SCALE.critical.color;
}

/**
 * Returns the risk level definition object for a score between 0 and 100.
 */
export function getRiskLevel(score: number) {
  if (score <= 25) return RISK_SCALE.low;
  if (score <= 50) return RISK_SCALE.medium;
  if (score <= 75) return RISK_SCALE.high;
  return RISK_SCALE.critical;
}

