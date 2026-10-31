import { motion, useReducedMotion } from 'framer-motion';
import { ChevronUp, Shield } from 'lucide-react';

export interface FooterProps {
  onLaunchTab?: (tab: 'risk' | 'graph' | 'remediation' | 'how') => void;
}

export default function Footer({ onLaunchTab }: FooterProps) {
  const prefersReduced = useReducedMotion();

  const handleScrollToSection = (id: string) => {
    const targetId = id.replace('#', '');
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });
  };

  const linkClass = `text-sm text-white/40 hover:text-[#F26A1B] transition-all duration-200 inline-block focus:outline-none focus-visible:ring-2 ring-[#F26A1B]/60 rounded ${
    prefersReduced ? '' : 'hover:translate-x-0.5'
  }`;

  return (
    <motion.footer
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative z-10 w-full overflow-hidden"
    >
      {/* ── TOP DIVIDER ───────────────────────────────────────────────────── */}
      <div className="relative w-full flex items-center justify-center">
        {/* Full-width glowing center-fade line */}
        <div
          className="w-full h-[1px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(242, 106, 27, 0.35) 50%, transparent 100%)',
          }}
        />
      </div>

      {/* ── FOOTER CONTENT ────────────────────────────────────────────────── */}
      <div className="landing-container py-16 px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          {/* Left Side: Brand wordmark & description */}
          <div className="md:col-span-5 flex flex-col items-start text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F26A1B]/20 to-[#FF7A2B]/10 border border-[#F26A1B]/30 flex items-center justify-center shadow-[0_0_15px_rgba(242,106,27,0.25)]">
                <Shield className="w-4 h-4 text-[#F26A1B]" />
              </div>
              <span
                className="font-semibold text-lg tracking-tight text-white"
                style={{ letterSpacing: '-0.02em' }}
              >
                Vidura
              </span>
            </div>
            <p className="mt-2 text-sm text-white/35 max-w-sm leading-relaxed">
              Cyber-risk intelligence for critical infrastructure.
            </p>
          </div>

          {/* Right Side: Three Columns of Links */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            {/* Column 1 — Platform */}
            <div className="flex flex-col space-y-3">
              <span className="text-xs uppercase tracking-widest font-semibold text-white/20 mb-1">
                Platform
              </span>
              <button
                type="button"
                onClick={() => (onLaunchTab ? onLaunchTab('risk') : handleScrollToSection('method'))}
                className={`text-left ${linkClass}`}
              >
                Risk Analysis
              </button>
              <button
                type="button"
                onClick={() => (onLaunchTab ? onLaunchTab('graph') : handleScrollToSection('method'))}
                className={`text-left ${linkClass}`}
              >
                Attack Graph
              </button>
              <button
                type="button"
                onClick={() => (onLaunchTab ? onLaunchTab('remediation') : handleScrollToSection('method'))}
                className={`text-left ${linkClass}`}
              >
                Remediation
              </button>
              <button
                type="button"
                onClick={() => handleScrollToSection('hero')}
                className={`text-left ${linkClass}`}
              >
                Threat Simulator
              </button>
            </div>

            {/* Column 2 — Frameworks (Static text) */}
            <div className="flex flex-col space-y-3">
              <span className="text-xs uppercase tracking-widest font-semibold text-white/20 mb-1">
                Frameworks
              </span>
              <span className="text-sm text-white/40 cursor-default select-none">
                MITRE ATT&amp;CK ICS
              </span>
              <span className="text-sm text-white/40 cursor-default select-none">
                NIST CSF 2.0
              </span>
              <span className="text-sm text-white/40 cursor-default select-none">
                IEC 62443
              </span>
              <span className="text-sm text-white/40 cursor-default select-none">
                FIRST EPSS
              </span>
            </div>

            {/* Column 3 — Context */}
            <div className="flex flex-col space-y-3">
              <span className="text-xs uppercase tracking-widest font-semibold text-white/20 mb-1">
                Context
              </span>
              <button
                type="button"
                onClick={() => handleScrollToSection('problem')}
                className={`text-left ${linkClass}`}
              >
                Problem Statement 03
              </button>
              <button
                type="button"
                onClick={() => handleScrollToSection('method')}
                className={`text-left ${linkClass}`}
              >
                Methodology
              </button>
              <button
                type="button"
                onClick={() => handleScrollToSection('personas')}
                className={`text-left ${linkClass}`}
              >
                Threat Personas
              </button>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR ──────────────────────────────────────────────────── */}
        <div className="border-t border-white/[0.06] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-white/25 font-mono tracking-tight text-center sm:text-left">
            D3COY 1.0 — DJS ISACA Hackathon 2026
          </span>

          <button
            type="button"
            onClick={handleScrollToTop}
            aria-label="Scroll to top"
            className="group glass-btn-circle h-10 w-10 shrink-0 border border-white/[0.1] bg-white/[0.06] hover:border-[#F26A1B]/60 hover:bg-[#F26A1B]/10 transition-colors focus:outline-none focus-visible:ring-2 ring-[#F26A1B]/60"
          >
            <ChevronUp className="w-4 h-4 text-white/40 group-hover:text-[#F26A1B] transition-colors" />
          </button>
        </div>
      </div>
    </motion.footer>
  );
}
