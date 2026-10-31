import { useState } from 'react';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export interface ViewsProps {
  onLaunchTab?: (tab: 'risk' | 'graph' | 'remediation' | 'how') => void;
}

type TabKey = 'risk' | 'graph' | 'remediation';

interface TabItem {
  id: TabKey;
  label: string;
}

const TABS: TabItem[] = [
  { id: 'risk', label: 'Risk Analysis' },
  { id: 'graph', label: 'Attack Graph' },
  { id: 'remediation', label: 'Remediation' },
];

// ── Tab 1 Illustration: Risk Table ─────────────────────────────────────────
function RiskTableView() {
  const rows = [
    {
      asset: 'Water SCADA Server',
      level: 'L3',
      score: 87,
      scoreLevel: 'critical',
      scoreColor: '#FF4D4F',
      epss: '0.94',
      recommendation: 'Segment VLAN',
    },
    {
      asset: 'Chlorine Dosing PLC',
      level: 'L1',
      score: 82,
      scoreLevel: 'critical',
      scoreColor: '#FF4D4F',
      epss: '0.89',
      recommendation: 'Firmware update',
    },
    {
      asset: 'Vendor SSL-VPN Gateway',
      level: 'L3.5',
      score: 71,
      scoreLevel: 'high',
      scoreColor: '#FF7A2B',
      epss: '0.72',
      recommendation: 'Rotate credentials',
    },
    {
      asset: 'Plant Historian (OSIsoft)',
      level: 'L3',
      score: 58,
      scoreLevel: 'medium',
      scoreColor: '#FFC24B',
      epss: '0.45',
      recommendation: 'Patch CVE-2024-3400',
    },
    {
      asset: 'Water Treatment HMI-02',
      level: 'L2',
      score: 34,
      scoreLevel: 'low',
      scoreColor: '#3DDC97',
      epss: '0.12',
      recommendation: 'Enable MFA',
    },
  ];

  return (
    <div className="p-4 sm:p-6 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[620px]">
        <thead>
          <tr className="border-b border-white/[0.08] text-[11px] font-mono text-[#6F6863] uppercase tracking-wider">
            <th className="pb-3 font-semibold pl-2">Asset</th>
            <th className="pb-3 font-semibold">Purdue Level</th>
            <th className="pb-3 font-semibold">Risk Score</th>
            <th className="pb-3 font-semibold">EPSS</th>
            <th className="pb-3 font-semibold pr-2">Recommendation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04] text-sm">
          {rows.map((row) => (
            <tr
              key={row.asset}
              className="group hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-3.5 pl-2 font-medium text-white flex items-center gap-2.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: row.scoreColor }}
                />
                <span>{row.asset}</span>
              </td>
              <td className="py-3.5 font-mono text-xs text-[#A09A96]">
                <span className="glass-pill px-2 py-0.5 border-white/[0.08] bg-white/[0.03]">
                  {row.level}
                </span>
              </td>
              <td className="py-3.5 font-mono text-xs">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-xs"
                  style={{
                    color: row.scoreColor,
                    backgroundColor: `${row.scoreColor}18`,
                    border: `1px solid ${row.scoreColor}35`,
                  }}
                >
                  {row.score}
                  <span className="text-[10px] uppercase tracking-tight opacity-80">
                    {row.scoreLevel}
                  </span>
                </span>
              </td>
              <td className="py-3.5 font-mono text-xs text-[#A09A96]">
                {row.epss}
              </td>
              <td className="py-3.5 pr-2 text-xs font-mono text-white/90">
                <span className="bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-md text-[#E8A817] group-hover:border-[#E8A817]/40 transition-colors">
                  {row.recommendation}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab 2 Illustration: Attack Graph ───────────────────────────────────────
function AttackGraphView({ prefersReduced }: { prefersReduced: boolean | null }) {
  const nodes = [
    { id: 'EXT', label: 'EXT', level: 'L4 Edge', x: 250, y: 35, color: '#6F6863' },
    { id: 'VPN', label: 'VPN', level: 'L3.5 DMZ', x: 190, y: 110, color: '#F26A1B' },
    { id: 'HIS', label: 'HIS', level: 'L3 Ops', x: 250, y: 185, color: '#FF7A2B' },
    { id: 'SCA', label: 'SCA', level: 'L2 Control', x: 310, y: 260, color: '#FF7A2B' },
    { id: 'PLC', label: 'PLC', level: 'L1 Field', x: 250, y: 330, color: '#FF4D4F' },
  ];

  return (
    <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg relative">
        <svg
          viewBox="0 0 500 370"
          className="w-full h-auto overflow-visible select-none"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="graph-arrow-orange"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" fill="#F26A1B" />
            </marker>
            <filter id="glow-plc" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Secondary Non-Critical Graph Edges */}
          <path
            d="M 250 35 L 340 110 L 250 185"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <path
            d="M 190 110 L 150 185 L 250 330"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Primary Attack Path: EXT -> VPN -> HIS -> SCA -> PLC */}
          <motion.path
            d="M 250 35 L 190 110 L 250 185 L 310 260 L 250 330"
            fill="none"
            stroke="#F26A1B"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            markerEnd="url(#graph-arrow-orange)"
            animate={
              prefersReduced ? undefined : { strokeDashoffset: [0, -20] }
            }
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Render Graph Nodes (30px diameter = r: 15) */}
          {nodes.map((node) => {
            const isTarget = node.id === 'PLC';

            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                {isTarget && (
                  <circle
                    r="22"
                    fill="none"
                    stroke="#FF4D4F"
                    strokeWidth="1.5"
                    opacity="0.4"
                    className="animate-ping origin-center"
                  />
                )}
                {/* Node Body */}
                <circle
                  r="15"
                  fill="#120D0B"
                  stroke={node.color}
                  strokeWidth="2"
                  filter={isTarget ? 'url(#glow-plc)' : undefined}
                />
                {/* 3-letter label */}
                <text
                  textAnchor="middle"
                  dy=".35em"
                  className="font-mono text-[11px] font-bold fill-white select-none pointer-events-none"
                >
                  {node.label}
                </text>
                {/* Subtitle / Level Label */}
                <text
                  x={node.x > 250 ? 24 : -24}
                  dy=".35em"
                  textAnchor={node.x > 250 ? 'start' : 'end'}
                  className="font-mono text-[10px] fill-[#A09A96] select-none"
                >
                  {node.level}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 text-xs font-mono text-[#A09A96]">
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-[#F26A1B] inline-block" />
          <span>Active Lateral Exploit Path</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-t border-dashed border-white/30 inline-block" />
          <span>Alternate Routes</span>
        </div>
      </div>
    </div>
  );
}

// ── Tab 3 Illustration: Remediation Bar Chart ──────────────────────────────
function RemediationView({ prefersReduced }: { prefersReduced: boolean | null }) {
  const actions = [
    { label: 'Segment SCADA VLAN', pct: 34, impactWidth: '88%', hours: '2.5 hrs' },
    { label: 'Update PLC firmware', pct: 22, impactWidth: '65%', hours: '4.0 hrs' },
    { label: 'Patch historian', pct: 15, impactWidth: '45%', hours: '1.5 hrs' },
    { label: 'Rotate VPN creds', pct: 10, impactWidth: '30%', hours: '0.5 hrs' },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs font-mono text-[#6F6863]">
        <span>RECOMMENDED ACTION</span>
        <span>RISK REDUCTION (%)</span>
      </div>

      <div className="space-y-5">
        {actions.map((act, index) => (
          <div key={act.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-white flex items-center gap-2">
                <span className="font-mono text-xs text-[#A09A96]">
                  0{index + 1}.
                </span>
                {act.label}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#A09A96] hidden sm:inline">
                  {act.hours}
                </span>
                <span className="font-mono text-sm font-bold text-[#F26A1B]">
                  {act.pct}%
                </span>
              </div>
            </div>

            {/* Bar track */}
            <div className="h-3 w-full rounded-full bg-white/[0.05] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #F26A1B 0%, #FF7A2B 100%)',
                }}
                initial={prefersReduced ? { width: `${act.pct * 2.5}%` } : { width: '0%' }}
                animate={{ width: `${act.pct * 2.5}%` }}
                transition={{
                  duration: prefersReduced ? 0 : 0.8,
                  delay: prefersReduced ? 0 : index * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-[#A09A96]">
        <span>Cumulative Risk Reduced: <strong className="text-white">81%</strong></span>
        <span>Total Engineering Time: <strong className="text-white">8.5 hrs</strong></span>
      </div>
    </div>
  );
}

// ── Main Views Section ─────────────────────────────────────────────────────
export default function Views({ onLaunchTab }: ViewsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('risk');
  const prefersReduced = useReducedMotion();

  return (
    <section id="views" className="landing-section scroll-mt-24">
      <motion.div
        initial={prefersReduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="landing-container"
      >
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          <div className="glass-pill inline-flex items-center gap-2 px-3.5 py-1.5 text-xs text-[#F26A1B] border border-white/[0.08] font-mono tracking-wider uppercase font-semibold">
            <span>DASHBOARD VIEWS</span>
          </div>

          <h2 className="h-display mt-5 text-3xl sm:text-4xl lg:text-5xl text-white max-w-3xl leading-[1.12]">
            Three lenses on the same threat landscape.
          </h2>
        </div>

        {/* Interactive Tab Switcher */}
        <div className="mt-10 sm:mt-12 flex justify-center">
          <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative rounded-xl px-5 sm:px-6 py-2.5 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 ring-[#F26A1B]/60 ${
                    isActive
                      ? 'text-[#F26A1B]'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                  style={{
                    backgroundColor: isActive
                      ? 'rgba(242, 106, 27, 0.12)'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: isActive
                      ? '1px solid rgba(242, 106, 27, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isActive
                      ? '0 0 24px rgba(242, 106, 27, 0.15)'
                      : 'none',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-highlight"
                      className="absolute inset-0 rounded-xl bg-[#F26A1B]/[0.12] border border-[#F26A1B]/40 shadow-[0_0_24px_rgba(242,106,27,0.15)] -z-10"
                      transition={
                        prefersReduced
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 350, damping: 30 }
                      }
                    />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview Window (Fake Browser Container) */}
        <div className="mt-8 max-w-5xl mx-auto rounded-[24px] border border-white/[0.06] bg-[#120D0B]/90 backdrop-blur-xl shadow-2xl shadow-black/80 overflow-hidden">
          {/* Browser Chrome Bar */}
          <div className="h-10 px-4 sm:px-6 flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03]">
            {/* Window control dots */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D4F]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFC24B]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#3DDC97]" />
            </div>

            {/* URL bar */}
            <div className="flex items-center justify-center px-4 py-1 rounded-md bg-black/40 border border-white/[0.04] text-[11px] font-mono text-white/30 max-w-xs sm:max-w-md w-full truncate">
              vidura.navanagar.gov.in/dashboard?view={activeTab}
            </div>

            {/* Deep link button into live dashboard */}
            <div>
              {onLaunchTab && (
                <button
                  type="button"
                  onClick={() => onLaunchTab(activeTab)}
                  className="glass-pill px-3 py-1 text-xs font-mono text-[#F26A1B] hover:text-[#FF7A2B] hover:border-[#F26A1B]/40 transition inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 ring-[#F26A1B]/60"
                >
                  <span className="hidden sm:inline">Open Live</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Browser Content Area with AnimatePresence */}
          <div className="min-h-[380px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={prefersReduced ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {activeTab === 'risk' && <RiskTableView />}
                {activeTab === 'graph' && (
                  <AttackGraphView prefersReduced={prefersReduced} />
                )}
                {activeTab === 'remediation' && (
                  <RemediationView prefersReduced={prefersReduced} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
