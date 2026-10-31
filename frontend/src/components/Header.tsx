import React, { useState, useEffect } from 'react';
import { FileDown, RotateCcw, Shield, ChevronDown, Menu, X } from 'lucide-react';
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
  onGoHome?: () => void;
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
  onGoHome,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabSelect = (tab: TabKey) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-32px)] max-w-[1200px] transition-all duration-250 ease-out ${
        mobileMenuOpen ? 'rounded-3xl' : 'rounded-full'
      } ${isScrolled ? 'floating-nav-scrolled py-2' : 'floating-nav py-2.5 sm:py-3'}`}
    >
      <div className="w-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand with Orange Shield */}
        <div
          onClick={onGoHome}
          className={`flex items-center gap-2.5 shrink-0 select-none ${onGoHome ? 'cursor-pointer group' : ''}`}
          title={onGoHome ? 'Return to Home' : undefined}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F26A1B]/20 to-[#FF7A2B]/10 border border-[#F26A1B]/30 flex items-center justify-center shadow-[0_0_15px_rgba(242,106,27,0.25)] group-hover:border-[#F26A1B]/60 transition-colors">
            <Shield className="w-4 h-4 text-[#F26A1B]" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className="font-semibold text-lg tracking-tight text-white group-hover:text-white/90"
              style={{ letterSpacing: '-0.02em' }}
            >
              Vidura
            </span>
            {onGoHome && (
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#A09A96] group-hover:text-white transition-colors">
                Home
              </span>
            )}
          </div>
        </div>

        {/* Center Navigation Tabs (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-full bg-white/[0.02] border border-white/[0.04]">
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="relative px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 text-[#A09A96] hover:text-white border border-transparent hover:bg-white/[0.04]"
            >
              Home
            </button>
          )}
          {TABS.map((t) => {
            const active = currentTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTabSelect(t.key)}
                className={`relative px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                  active
                    ? 'text-[#F26A1B] bg-[#F26A1B]/15 border border-[#F26A1B]/40 shadow-[0_0_12px_rgba(242,106,27,0.25)] font-semibold'
                    : 'text-[#A09A96] hover:text-white border border-transparent hover:bg-white/[0.04]'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isDemoMode && (
            <span className="hidden sm:inline-flex text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
              Demo mode
            </span>
          )}

          {/* Threat Drop ghost pill */}
          <button
            onClick={onToggleThreatDrop}
            title="Simulate a new CISA KEV advisory (CVE-2023-6448) — shortcut T"
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 shrink-0 ${
              threatDropActive
                ? 'bg-[#FF4D4F]/15 border border-[#FF4D4F] text-[#FF4D4F] shadow-[0_0_18px_rgba(255,77,79,0.35)]'
                : 'glass-pill text-[#A09A96] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  threatDropActive ? 'bg-[#FF4D4F] animate-pulse' : 'bg-[#6F6863]'
                }`}
              />
              <span className="hidden sm:inline">{threatDropActive ? 'Threat drop: active' : 'Threat drop'}</span>
              <span className="sm:hidden">Threat</span>
            </span>
          </button>

          {/* Persona selector as glass dropdown */}
          <div className="relative flex items-center">
            <label className="flex items-center gap-1.5 text-xs text-[#6F6863]">
              <span className="hidden xl:inline">Persona</span>
              <div className="relative">
                <select
                  value={persona}
                  onChange={(e) => onPersonaChange(e.target.value as PersonaType)}
                  className="appearance-none text-xs text-white bg-[#120D0B]/90 border border-white/10 rounded-full pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#F26A1B] focus:border-[#F26A1B] hover:border-white/20 transition-all cursor-pointer shadow-sm"
                >
                  <option value="nation_state" className="bg-[#120D0B] text-white">Nation-state APT</option>
                  <option value="opportunistic" className="bg-[#120D0B] text-white">Opportunistic</option>
                  <option value="insider" className="bg-[#120D0B] text-white">Insider</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#A09A96] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </label>
          </div>

          {/* Export PDF circular glass button */}
          <button
            onClick={onExportPdf}
            title="Download management briefing (PDF)"
            aria-label="Download management briefing PDF"
            className="glass-btn-circle"
          >
            <FileDown className="w-4 h-4" />
          </button>

          {/* Reset session circular glass button */}
          <button
            onClick={onResetSession}
            title="Reset demo session — shortcut D"
            aria-label="Reset session"
            className="glass-btn-circle"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="lg:hidden glass-btn-circle ml-1"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-[calc(100%+8px)] left-0 right-0 p-4 rounded-3xl glass-card bg-[#120D0B]/95 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col gap-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="text-[11px] font-semibold text-[#6F6863] uppercase tracking-wider px-2 pb-1">
            Navigation
          </div>
          <div className="grid grid-cols-2 gap-2">
            {onGoHome && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGoHome();
                }}
                className="px-3 py-2 text-xs font-medium rounded-xl text-left transition-all text-[#A09A96] bg-white/[0.02] border border-white/[0.06] hover:text-white hover:bg-white/[0.05]"
              >
                Home
              </button>
            )}
            {TABS.map((t) => {
              const active = currentTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => handleTabSelect(t.key)}
                  className={`px-3 py-2 text-xs font-medium rounded-xl text-left transition-all ${
                    active
                      ? 'text-[#F26A1B] bg-[#F26A1B]/15 border border-[#F26A1B]/40 font-semibold'
                      : 'text-[#A09A96] bg-white/[0.02] border border-white/[0.06] hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
