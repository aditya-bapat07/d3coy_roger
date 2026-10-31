import { useRef, useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';

interface StepData {
  number: number;
  title: string;
  body: string;
  renderGraphic: (prefersReduced: boolean | null) => React.ReactNode;
}

// ── Decorative Graphic 1: Purdue Model Stack ──────────────────────────────
function PurdueGraphic() {
  const levels = [
    { id: 'L4', name: 'Enterprise IT', active: false },
    { id: 'L3', name: 'Site Operations & DMZ', active: false },
    { id: 'L2', name: 'Supervisory & SCADA', active: false },
    { id: 'L1', name: 'Field Controllers & PLCs', active: true },
    { id: 'L0', name: 'Physical Actuators & Sensors', active: false },
  ];

  return (
    <div className="glass-card p-5 rounded-2xl border border-white/[0.08] bg-[#120D0B]/80 max-w-lg w-full">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs font-mono text-[#A09A96]">
        <span>PURDUE MODEL HIERARCHY</span>
        <span className="text-[#F26A1B]">AUTO-CLASSIFIED</span>
      </div>
      <div className="mt-4 space-y-2 relative">
        {/* Vertical connector line */}
        <div className="absolute left-6 top-3 bottom-3 w-[1px] bg-white/[0.12] -z-0" />

        {levels.map((lvl) => (
          <div
            key={lvl.id}
            className={`relative z-10 flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
              lvl.active
                ? 'bg-[#F26A1B]/15 border-[#F26A1B]/50 shadow-[0_0_15px_rgba(242,106,27,0.2)] text-white'
                : 'bg-black/30 border-white/[0.06] text-[#A09A96]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-6 w-8 items-center justify-center rounded font-mono font-bold text-[11px] ${
                  lvl.active
                    ? 'bg-[#F26A1B] text-white'
                    : 'bg-white/[0.06] text-[#6F6863]'
                }`}
              >
                {lvl.id}
              </span>
              <span className="font-medium text-xs">{lvl.name}</span>
            </div>
            {lvl.active && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-[#F26A1B] uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F26A1B] animate-ping" />
                Target Zone
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Decorative Graphic 2: Risk Meter Slider ────────────────────────────────
function RiskMeterGraphic({ prefersReduced }: { prefersReduced: boolean | null }) {
  return (
    <div className="glass-card p-5 rounded-2xl border border-white/[0.08] bg-[#120D0B]/80 max-w-lg w-full">
      <div className="flex items-center justify-between text-xs font-mono text-[#A09A96]">
        <span>FIRST EPSS + CISA KEV + IMPACT</span>
        <span className="text-[#FF7A2B] font-bold">SCORE: 73 / 100</span>
      </div>

      {/* Horizontal Gradient Bar */}
      <div className="mt-6 relative pt-6 pb-2">
        {/* Track bar */}
        <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-[#3DDC97] via-[#FFC24B] via-60% via-[#FF7A2B] to-[#FF4D4F] relative shadow-inner" />

        {/* Marker dot and tooltip */}
        <motion.div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
          initial={prefersReduced ? { left: '73%' } : { left: '0%' }}
          whileInView={{ left: '73%' }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <div className="glass-pill px-2 py-0.5 text-[10px] font-mono font-bold text-white bg-[#FF7A2B] shadow-md border-0 mb-1">
            73 HIGH
          </div>
          <div className="h-4 w-4 rounded-full bg-[#120D0B] border-2 border-white shadow-[0_0_12px_rgba(255,122,43,0.9)]" />
        </motion.div>
      </div>

      <div className="mt-2 flex justify-between text-[11px] font-mono text-[#6F6863]">
        <span className="text-[#3DDC97]">0 Low</span>
        <span>40 Med</span>
        <span className="text-[#FF7A2B]">70 High</span>
        <span className="text-[#FF4D4F]">100 Critical</span>
      </div>
    </div>
  );
}

// ── Decorative Graphic 3: Attack Path Graph ────────────────────────────────
function AttackPathGraphic({ prefersReduced }: { prefersReduced: boolean | null }) {
  return (
    <div className="glass-card p-5 rounded-2xl border border-white/[0.08] bg-[#120D0B]/80 max-w-lg w-full">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs font-mono text-[#A09A96]">
        <span>MONTE CARLO SIMULATION</span>
        <span className="text-[#F26A1B]">HIGH PROBABILITY PATH</span>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <svg
          viewBox="0 0 380 140"
          className="w-full h-auto overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="arrowhead-orange"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 6 3, 0 6" fill="#F26A1B" />
            </marker>
          </defs>

          {/* Alternate benign path */}
          <path
            d="M 50 70 C 100 20, 160 20, 220 70"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Primary simulated attack path */}
          <motion.path
            d="M 50 70 L 140 70 L 230 70 L 320 70"
            fill="none"
            stroke="#F26A1B"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            markerEnd="url(#arrowhead-orange)"
            animate={
              prefersReduced ? undefined : { strokeDashoffset: [0, -20] }
            }
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Node 1: Edge */}
          <g transform="translate(50, 70)">
            <circle r="14" fill="#120D0B" stroke="#6F6863" strokeWidth="2" />
            <circle r="4" fill="#A09A96" />
            <text
              y="26"
              textAnchor="middle"
              className="fill-[#A09A96] text-[10px] font-mono"
            >
              Internet
            </text>
          </g>

          {/* Node 2: VPN */}
          <g transform="translate(140, 70)">
            <circle r="14" fill="#120D0B" stroke="#F26A1B" strokeWidth="2" />
            <circle r="5" fill="#F26A1B" />
            <text
              y="26"
              textAnchor="middle"
              className="fill-[#F26A1B] text-[10px] font-mono font-bold"
            >
              VPN Gateway
            </text>
          </g>

          {/* Node 3: Historian */}
          <g transform="translate(230, 70)">
            <circle r="14" fill="#120D0B" stroke="#FF7A2B" strokeWidth="2" />
            <circle r="5" fill="#FF7A2B" />
            <text
              y="26"
              textAnchor="middle"
              className="fill-[#FF7A2B] text-[10px] font-mono font-bold"
            >
              Historian
            </text>
          </g>

          {/* Node 4: Target PLC */}
          <g transform="translate(320, 70)">
            <circle
              r="17"
              fill="rgba(255, 77, 79, 0.2)"
              stroke="#FF4D4F"
              strokeWidth="2"
            />
            <circle r="6" fill="#FF4D4F" />
            <text
              y="28"
              textAnchor="middle"
              className="fill-[#FF4D4F] text-[10px] font-mono font-bold"
            >
              Chlorine PLC
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}

// ── Decorative Graphic 4: Remediation Priorities ───────────────────────────
function RemediationGraphic({ prefersReduced }: { prefersReduced: boolean | null }) {
  const fixes = [
    { label: 'Segment SCADA VLAN', impact: '88%', reduction: '+42% safety', color: '#F26A1B' },
    { label: 'Patch historian CVE-2024-38856', impact: '64%', reduction: '+28% safety', color: '#FF7A2B' },
    { label: 'Rotate VPN creds', impact: '40%', reduction: '+15% safety', color: '#FFC24B' },
  ];

  return (
    <div className="glass-card p-5 rounded-2xl border border-white/[0.08] bg-[#120D0B]/80 max-w-lg w-full">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs font-mono text-[#A09A96]">
        <span>OPTIMAL FIX SEQUENCE</span>
        <span className="text-[#3DDC97]">MAX ROI PER HOUR</span>
      </div>

      <div className="mt-4 space-y-3.5">
        {fixes.map((fix, idx) => (
          <div key={fix.label} className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-white/90">{fix.label}</span>
              <span className="font-mono text-xs font-semibold" style={{ color: fix.color }}>
                {fix.reduction}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: fix.color }}
                initial={prefersReduced ? { width: fix.impact } : { width: '0%' }}
                whileInView={{ width: fix.impact }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  delay: prefersReduced ? 0 : 0.15 * idx,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS: StepData[] = [
  {
    number: 1,
    title: 'Map every asset',
    body: 'Vidura ingests your OT network topology — PLCs, HMIs, historians, switches — and places each asset on the Purdue Model hierarchy automatically. No manual spreadsheets.',
    renderGraphic: () => <PurdueGraphic />,
  },
  {
    number: 2,
    title: 'Score real-world risk',
    body: 'Each asset gets a composite risk score combining FIRST EPSS exploit probability, CISA KEV status, CVSS base metrics, and Vidura’s own cascade-impact model that weighs how many citizens lose service.',
    renderGraphic: (prefersReduced) => <RiskMeterGraphic prefersReduced={prefersReduced} />,
  },
  {
    number: 3,
    title: 'Simulate attack paths',
    body: 'Vidura builds a directed graph of every lateral movement path an attacker could take, then runs Monte Carlo simulations to find which paths have the highest combined probability × impact.',
    renderGraphic: (prefersReduced) => <AttackPathGraphic prefersReduced={prefersReduced} />,
  },
  {
    number: 4,
    title: 'Prioritise fixes',
    body: 'The remediation engine ranks every possible intervention by risk-reduction-per-hour, so your team spends engineering time where it actually moves the needle.',
    renderGraphic: (prefersReduced) => <RemediationGraphic prefersReduced={prefersReduced} />,
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);

  // Parallax scroll progress for the left connector fill
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start center', 'end 80%'],
  });

  const progressHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  // Track active step based on scroll intersection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-step-index'));
            if (!isNaN(index)) {
              setActiveStep(index);
            }
          }
        });
      },
      {
        rootMargin: '-30% 0px -40% 0px',
        threshold: 0.2,
      }
    );

    STEPS.forEach((_, idx) => {
      const el = document.getElementById(`method-step-${idx}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="method" ref={sectionRef} className="landing-section scroll-mt-24">
      <div className="landing-container">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-12 sm:mb-20">
          <div className="glass-pill inline-flex items-center gap-2 px-3.5 py-1.5 text-xs text-[#F26A1B] border border-white/[0.08] font-mono tracking-wider uppercase font-semibold">
            <span>HOW VIDURA WORKS</span>
          </div>
          <h2 className="h-display mt-5 text-3xl sm:text-4xl lg:text-5xl text-white max-w-3xl leading-[1.12]">
            Four steps from asset inventory to prioritised fix list.
          </h2>
        </div>

        {/* ── DESKTOP LAYOUT (Sticky Stepper Left, Content Blocks Right) ──────── */}
        <div className="hidden md:flex gap-12 lg:gap-16 items-start relative">
          {/* Left Column: Sticky Vertical Stepper */}
          <div className="w-1/3 sticky top-1/2 -translate-y-1/2 self-start py-8">
            <div className="relative pl-2">
              {/* Vertical connector line track */}
              <div className="absolute left-[27px] top-5 bottom-5 w-[2px] bg-white/[0.08] -z-0" />

              {/* Progress fill line */}
              <motion.div
                className="absolute left-[27px] top-5 w-[2px] bg-[#F26A1B] origin-top -z-0"
                style={{
                  height: prefersReduced ? '100%' : progressHeight,
                  boxShadow: '0 0 10px rgba(242, 106, 27, 0.6)',
                }}
              />

              {/* Stepper items */}
              <div className="space-y-12 relative z-10">
                {STEPS.map((step, idx) => {
                  const isActive = activeStep === idx;
                  const isPassed = activeStep > idx;

                  return (
                    <div
                      key={step.number}
                      className="flex items-center gap-4 group cursor-pointer"
                      onClick={() => {
                        const el = document.getElementById(`method-step-${idx}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      {/* Circle 40px */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold transition-all duration-300 ${
                          isActive
                            ? 'border-2 border-[#F26A1B] bg-[#120D0B] text-white shadow-[0_0_20px_rgba(242,106,27,0.3)] scale-110'
                            : isPassed
                            ? 'border-2 border-[#F26A1B]/70 bg-[#120D0B] text-white/90'
                            : 'border-2 border-white/[0.12] bg-[#120D0B] text-[#6F6863]'
                        }`}
                      >
                        {step.number}
                      </div>

                      {/* Step Title Label */}
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-semibold transition-colors duration-300 ${
                            isActive
                              ? 'text-white'
                              : isPassed
                              ? 'text-[#A09A96]'
                              : 'text-[#6F6863]'
                          }`}
                        >
                          {step.title}
                        </span>
                        <span className="text-[11px] font-mono text-[#6F6863]">
                          Step 0{step.number}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Step Content Blocks (min-h-[60vh] each) */}
          <div className="w-2/3 flex flex-col">
            {STEPS.map((step, idx) => (
              <div
                key={step.number}
                id={`method-step-${idx}`}
                data-step-index={idx}
                className="min-h-[60vh] flex flex-col justify-center py-12"
              >
                <motion.div
                  initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
                  whileInView={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20%' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="flex flex-col items-start text-left"
                >
                  {/* Step Eyebrow */}
                  <div className="glass-pill px-3 py-1 text-xs font-mono font-bold text-[#F26A1B] border-[#F26A1B]/30 bg-[#F26A1B]/10 mb-4">
                    STEP 0{step.number}
                  </div>

                  {/* Title */}
                  <h3 className="h-display text-2xl sm:text-3xl text-white font-bold">
                    {step.title}
                  </h3>

                  {/* Body */}
                  <p className="mt-4 text-[#A09A96] text-base leading-relaxed max-w-xl">
                    {step.body}
                  </p>

                  {/* Decorative Interactive Graphic */}
                  <div className="mt-8 w-full">
                    {step.renderGraphic(prefersReduced)}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MOBILE LAYOUT (Sequential Cards Stack) ────────────────────────── */}
        <div className="flex flex-col gap-8 md:hidden">
          {STEPS.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 30 }}
              whileInView={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{
                duration: 0.5,
                delay: prefersReduced ? 0 : idx * 0.1,
                ease: 'easeOut',
              }}
              className="glass-card p-6 sm:p-8 flex flex-col rounded-[20px] text-left border border-white/[0.08] bg-[#120D0B]/85"
            >
              <div className="glass-pill self-start px-3 py-1 text-xs font-mono font-bold text-[#F26A1B] border-[#F26A1B]/30 bg-[#F26A1B]/10 mb-4">
                STEP 0{step.number}
              </div>
              <h3 className="h-display text-xl sm:text-2xl text-white font-bold">
                {step.title}
              </h3>
              <p className="mt-3 text-sm text-[#A09A96] leading-relaxed">
                {step.body}
              </p>
              <div className="mt-6 w-full">
                {step.renderGraphic(prefersReduced)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
