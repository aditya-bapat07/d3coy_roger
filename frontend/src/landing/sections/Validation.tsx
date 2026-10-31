import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

interface StatItem {
  id: string;
  target: number;
  isDecimal?: boolean;
  label: string;
}

const STATS: StatItem[] = [
  { id: 'purdue', target: 12, label: 'Purdue zones modelled' },
  { id: 'cves', target: 847, label: 'CVEs in risk engine' },
  { id: 'scenarios', target: 6, label: 'ICS attack scenarios' },
  { id: 'detection', target: 4.2, isDecimal: true, label: 'hrs avg detection improvement' },
];

const FRAMEWORKS = [
  'MITRE ATT&CK ICS',
  'NIST CSF 2.0',
  'IEC 62443',
  'FIRST EPSS',
  'CISA KEV',
  'NVD',
  'CVSS v3.1',
  'Purdue / ISA-95',
  'CERT-In',
  'SSVC',
];

function AnimatedCounter({
  target,
  isDecimal = false,
  isInView,
  prefersReduced,
}: {
  target: number;
  isDecimal?: boolean;
  isInView: boolean;
  prefersReduced: boolean | null;
}) {
  const [count, setCount] = useState<number>(prefersReduced ? target : 0);

  useEffect(() => {
    if (prefersReduced) {
      setCount(target);
      return;
    }
    if (!isInView) return;

    let startTime: number | null = null;
    let rafId: number;
    const duration = 1600; // 1.6s

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic: fast start, slow settle
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      setCount(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isInView, target, prefersReduced]);

  return (
    <span>{isDecimal ? count.toFixed(1) : Math.round(count).toString()}</span>
  );
}

export default function Validation() {
  const prefersReduced = useReducedMotion();
  const statsRef = useRef<HTMLDivElement>(null);
  const isStatsInView = useInView(statsRef, { once: true, margin: '-40px' });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.04,
      },
    },
  };

  const badgeVariants = {
    hidden: prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  return (
    <section id="validation" className="landing-section scroll-mt-24">
      <div className="landing-container">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          <div className="glass-pill inline-flex items-center gap-2 px-3.5 py-1.5 text-xs text-[#F26A1B] border border-white/[0.08] font-mono tracking-wider uppercase font-semibold">
            <span>VALIDATION</span>
          </div>

          <h2 className="h-display mt-5 text-3xl sm:text-4xl lg:text-5xl text-white max-w-3xl leading-[1.12]">
            Grounded in the frameworks that matter.
          </h2>
        </div>

        {/* PART 1 — Animated Stat Counters (Row of 4) */}
        <div
          ref={statsRef}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mt-14 sm:mt-20 text-center"
        >
          {STATS.map((stat) => (
            <div
              key={stat.id}
              className="flex flex-col items-center p-6 rounded-2xl glass-card border border-white/[0.06] bg-[#120D0B]/70"
            >
              <div className="text-4xl sm:text-5xl font-extrabold text-white font-['Manrope'] tracking-tight">
                <AnimatedCounter
                  target={stat.target}
                  isDecimal={stat.isDecimal}
                  isInView={isStatsInView}
                  prefersReduced={prefersReduced}
                />
              </div>
              <div className="text-xs uppercase tracking-widest text-white/40 mt-3 font-mono font-medium max-w-[18ch]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* PART 2 — Framework Badges Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-30px' }}
          className="flex flex-wrap justify-center items-center gap-3 mt-14 sm:mt-16 max-w-4xl mx-auto"
        >
          {FRAMEWORKS.map((badge) => (
            <motion.div
              key={badge}
              variants={badgeVariants}
              className="glass-pill px-5 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/[0.45] font-mono text-xs sm:text-sm font-medium tracking-wide transition-all duration-200 cursor-default select-none hover:text-[#F26A1B] hover:border-[#F26A1B]/40 hover:bg-[#F26A1B]/[0.06] hover:shadow-[0_0_16px_rgba(242,106,27,0.12)]"
            >
              {badge}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
