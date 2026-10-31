import { useRef, useState, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion';
import {
  Wifi,
  GitBranch,
  Layers,
  BarChart3,
  ShieldAlert,
  Zap,
  LucideIcon,
} from 'lucide-react';

interface CapabilityItem {
  icon: LucideIcon;
  title: string;
  body: string;
}

const CAPABILITIES: CapabilityItem[] = [
  {
    icon: Wifi,
    title: 'Offline-first architecture',
    body: 'Runs air-gapped. No cloud dependency, no telemetry home. Your OT topology never leaves your network perimeter.',
  },
  {
    icon: GitBranch,
    title: 'Attack path simulation',
    body: 'Directed-graph engine models every lateral movement route an attacker could chain, weighted by real exploit probabilities from FIRST EPSS.',
  },
  {
    icon: Layers,
    title: 'Purdue Model mapping',
    body: 'Assets auto-classified across L0-L4 with cross-level dependency tracking. See exactly where IT/OT boundaries blur.',
  },
  {
    icon: BarChart3,
    title: 'Risk-per-hour prioritisation',
    body: 'Remediation ranked by risk-reduction divided by engineering hours, so finite budgets go where they matter most.',
  },
  {
    icon: ShieldAlert,
    title: 'MITRE ATT&CK ICS alignment',
    body: 'Every attack path maps to ATT&CK for ICS tactics and techniques. Speak the same language as your threat intel team.',
  },
  {
    icon: Zap,
    title: 'Live threat simulation',
    body: 'Inject anomalies, trigger cascade scenarios, watch risk scores update in real time. Train your SOC without touching production.',
  },
];

interface CapabilityCardProps {
  item: CapabilityItem;
  index: number;
  prefersReduced: boolean | null;
}

function CapabilityCard({ item, index, prefersReduced }: CapabilityCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Raw magnetic pull values
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Smooth physical spring (stiffness: 300, damping: 25)
  const springConfig = { stiffness: 300, damping: 25 };
  const smoothX = useSpring(rawX, springConfig);
  const smoothY = useSpring(rawY, springConfig);

  // Magnetic hover effect (tracks distance from cursor to card center)
  useEffect(() => {
    if (prefersReduced) return;

    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy);

      // Magnetic field radius: 120px threshold around the card center
      const fieldRadius = Math.max(rect.width, rect.height) / 2 + 120;

      if (dist <= fieldRadius) {
        // Apply transform: translate(dx * 0.05, dy * 0.05), capped at max 6px
        const shiftX = Math.max(-6, Math.min(6, dx * 0.05));
        const shiftY = Math.max(-6, Math.min(6, dy * 0.05));

        rafId = requestAnimationFrame(() => {
          rawX.set(shiftX);
          rawY.set(shiftY);
        });
      } else {
        rafId = requestAnimationFrame(() => {
          rawX.set(0);
          rawY.set(0);
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [rawX, rawY, prefersReduced]);

  const IconComponent = item.icon;

  return (
    <div style={{ perspective: 800 }} className="h-full">
      <motion.div
        ref={cardRef}
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 32 }}
        whileInView={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{
          duration: prefersReduced ? 0.3 : 0.55,
          delay: prefersReduced ? 0 : index * 0.08,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
        onMouseEnter={() => {
          if (!prefersReduced) setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          rawX.set(0);
          rawY.set(0);
        }}
        animate={{
          z: isHovered && !prefersReduced ? 8 : 0,
        }}
        style={{
          x: prefersReduced ? 0 : smoothX,
          y: prefersReduced ? 0 : smoothY,
          transformStyle: 'preserve-3d',
          backgroundColor: 'rgba(18, 13, 11, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '20px',
          padding: '28px',
          border:
            isHovered && !prefersReduced
              ? '1px solid rgba(242, 106, 27, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow:
            isHovered && !prefersReduced
              ? 'inset 0 0 60px rgba(242, 106, 27, 0.04), 0 16px 36px -12px rgba(0, 0, 0, 0.6)'
              : 'none',
        }}
        className="relative flex flex-col justify-start h-full text-left transition-colors duration-200"
      >
        {/* Icon container: 48px square, rounded-2xl, bg rgba(242,106,27,0.08) */}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F26A1B]/[0.08] border border-[#F26A1B]/20 shrink-0">
          <IconComponent className="w-6 h-6 text-[#F26A1B]" />
        </div>

        {/* Title */}
        <h3 className="mt-4 text-base font-bold text-white tracking-tight">
          {item.title}
        </h3>

        {/* Body */}
        <p className="mt-2 text-sm text-white/50 leading-[1.7]">
          {item.body}
        </p>
      </motion.div>
    </div>
  );
}

export default function Capabilities() {
  const prefersReduced = useReducedMotion();

  return (
    <section id="capabilities" className="landing-section scroll-mt-24">
      <div className="landing-container">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          <div className="glass-pill inline-flex items-center gap-2 px-3.5 py-1.5 text-xs text-[#F26A1B] border border-white/[0.08] font-mono tracking-wider uppercase font-semibold">
            <span>CAPABILITIES</span>
          </div>

          <h2 className="h-display mt-5 text-3xl sm:text-4xl lg:text-5xl text-white max-w-3xl leading-[1.12]">
            Built for the constraints OT security actually has.
          </h2>
        </div>

        {/* Capabilities 2x3 Grid (Desktop), 1-col (Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 sm:mt-16 items-stretch">
          {CAPABILITIES.map((item, index) => (
            <CapabilityCard
              key={item.title}
              item={item}
              index={index}
              prefersReduced={prefersReduced}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
