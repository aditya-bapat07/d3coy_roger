import React from 'react';
import { FileDown, RotateCcw } from 'lucide-react';
import { PersonaType } from '../types/api';

type TabKey = 'risk' | 'graph' | 'remediation' | 'how';

interface HeaderProps {
  currentTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  persona: PersonaType;
  onPersonaChange: (p: PersonaType) => void;
  threatDropActive: boolean;
  onToggleThreatDrop: () => void;
  onExportPdf: () => void;
  onResetSession: () => void;
  loading: boolean;
  isDemoMode?: boolean;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'risk', label: 'Dashboard' },
  { key: 'graph', label: 'Graph' },
  { key: 'remediation', label: 'Remediation' },
  { key: 'how', label: 'How It Works' },
];

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  persona,
  onPersonaChange,
  threatDropActive,
  onToggleThreatDrop,
  onExportPdf,
  onResetSession,
  isDemoMode = false,
}) => {
  return (
    <header className="sticky top-0 z-40 h-12 bg-white border-b border-[--border-default]">
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center gap-8">
        <span
          style={{
            fontWeight: 600,
            fontSize: '1.125rem',
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
          }}
        >
          Vidura
        </span>

        <nav className="flex items-stretch h-full gap-6">
          {TABS.map((t) => {
            const active = currentTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className={`text-sm border-b-2 -mb-px transition-colors duration-150 ${
                  active
                    ? 'border-[--accent-primary] text-[--text-primary] font-medium'
                    : 'border-transparent text-[--text-secondary] hover:text-[--text-primary]'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {isDemoMode && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              Demo mode
            </span>
          )}

          <button
            onClick={onToggleThreatDrop}
            title="Simulate a new CISA KEV advisory (CVE-2023-6448) — shortcut T"
            className={`text-xs px-2 py-1 rounded border transition-colors duration-150 ${
              threatDropActive
                ? 'border-[--risk-critical] text-[--risk-critical] bg-red-50'
                : 'border-[--border-default] text-[--text-secondary] hover:text-[--text-primary]'
            }`}
          >
            {threatDropActive ? 'Threat drop: on' : 'Threat drop'}
          </button>

          <label className="flex items-center gap-1.5 text-sm text-[--text-secondary]">
            <span className="text-xs">Persona</span>
            <select
              value={persona}
              onChange={(e) => onPersonaChange(e.target.value as PersonaType)}
              className="text-sm text-[--text-primary] bg-white border border-[--border-default] rounded px-1.5 py-0.5 focus:outline-none focus:border-[--accent-primary] cursor-pointer"
            >
              <option value="nation_state">Nation-state APT</option>
              <option value="opportunistic">Opportunistic</option>
              <option value="insider">Insider</option>
            </select>
          </label>

          <button
            onClick={onExportPdf}
            title="Download management briefing (PDF)"
            aria-label="Download management briefing PDF"
            className="p-1.5 rounded text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--bg-secondary] transition-colors duration-150"
          >
            <FileDown className="w-4 h-4" />
          </button>
          <button
            onClick={onResetSession}
            title="Reset demo session — shortcut D"
            aria-label="Reset session"
            className="p-1.5 rounded text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--bg-secondary] transition-colors duration-150"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
