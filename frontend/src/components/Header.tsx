import React from 'react';
import {
  ShieldAlert,
  UserCheck,
  FileDown,
  Flame,
  Activity,
  Layers,
  Wrench,
  RotateCcw,
} from 'lucide-react';
import { PersonaType } from '../types/api';

interface HeaderProps {
  currentTab: 'risk' | 'graph' | 'remediation';
  onTabChange: (tab: 'risk' | 'graph' | 'remediation') => void;
  persona: PersonaType;
  onPersonaChange: (p: PersonaType) => void;
  threatDropActive: boolean;
  onToggleThreatDrop: () => void;
  onExportPdf: () => void;
  onResetSession: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  persona,
  onPersonaChange,
  threatDropActive,
  onToggleThreatDrop,
  onExportPdf,
  onResetSession,
  loading,
}) => {
  return (
    <header className="border-b border-[#23324A] bg-[#111827]/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & City Context */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-lg text-white">Vidura</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-950 border border-blue-500/40 text-blue-300 font-mono">
                Navanagar • 5 Lakh CII
              </span>
              {threatDropActive && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-300 font-mono flex items-center gap-1 animate-pulse">
                  <Flame className="w-3 h-3 text-red-400" /> KEV DROP ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              AI-Based Critical Infrastructure Cyber-Risk Prediction & Prioritisation
            </p>
          </div>
        </div>

        {/* 3 Core Triad Views */}
        <nav className="flex items-center bg-[#162032] border border-[#23324A] rounded-lg p-1">
          <button
            onClick={() => onTabChange('risk')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition ${
              currentTab === 'risk'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            1. What is most at risk?
          </button>
          <button
            onClick={() => onTabChange('graph')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition ${
              currentTab === 'graph'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            2. Why? (Attack & Cascade)
          </button>
          <button
            onClick={() => onTabChange('remediation')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition ${
              currentTab === 'remediation'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            3. What do I do first?
          </button>
        </nav>

        {/* Threat Actor Persona & Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Persona Selector */}
          <div className="flex items-center gap-1.5 bg-[#162032] border border-[#23324A] rounded-lg px-2.5 py-1 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Persona:</span>
            <select
              value={persona}
              onChange={(e) => onPersonaChange(e.target.value as PersonaType)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="nation_state" className="bg-[#162032]">State-Sponsored APT</option>
              <option value="opportunistic" className="bg-[#162032]">Opportunistic Criminal</option>
              <option value="insider" className="bg-[#162032]">Compromised Insider</option>
            </select>
          </div>

          {/* Threat Drop Demo Toggle */}
          <button
            onClick={onToggleThreatDrop}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              threatDropActive
                ? 'bg-red-950/80 border-red-500 text-red-200'
                : 'bg-[#162032] border-[#23324A] text-slate-300 hover:bg-[#1C293F]'
            }`}
            title="Simulate incoming CISA KEV Advisory on Unitronics PLCs"
          >
            <Flame className={`w-3.5 h-3.5 ${threatDropActive ? 'text-red-400' : 'text-slate-400'}`} />
            {threatDropActive ? 'Revert Threat Drop' : 'Simulate Threat Drop'}
          </button>

          {/* PDF Export Button */}
          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition"
            title="Download CERT-In Aligned Executive PDF Briefing"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export PDF
          </button>

          {/* Reset Demo State */}
          <button
            onClick={onResetSession}
            className="p-1.5 rounded-lg bg-[#162032] hover:bg-[#1C293F] border border-[#23324A] text-slate-400 hover:text-white transition"
            title="Reset Session Injections"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
