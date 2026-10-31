import { useRef, useState, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion';
import {
  Wifi,
  Clock,
  Droplets,
  Terminal,
  Scale,
  ShieldCheck,
  Check,
  X,
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
    title: 'Offline-First & Air-Gapped',
    body: 'Runs 100% offline with zero cloud phone-home. Your OT network topology, SCADA registers, and vulnerability maps never leave your isolated security perimeter.',
  },
  {
    icon: Clock,
    title: 'Time-to-Criticality Timeline',
    body: 'Interactive propagation playback answers "What breaks first?" — tracing lateral traversal from T+0h perimeter ingress down to L1/L0 field controller hijack.',
  },
  {
    icon: Droplets,
    title: 'Physical Impact & Municipal SLAs',
    body: 'Replaces abstract CVSS with real operational consequence: MLD potable water flow lost, electrical MW tripped, and emergency reserve buffer hours to dry taps.',
  },
  {
    icon: Terminal,
    title: 'Zero-Downtime Virtual Patching',
    body: 'Generates drop-in Cisco ACL, FortiOS firewall policies, and Suricata DPI rules blocking unauthorized Modbus function codes without rebooting running PLCs.',
  },
  {
    icon: Scale,
    title: '42x Adversary Work-Factor Ratio',
    body: 'Optimises engineering hours to maximize attacker effort. A 14-hour defensive configuration imposes 160+ adversary exploit development hours.',
  },
  {
    icon: ShieldCheck,
    title: 'Sovereign Regulatory Audit Binder',
    body: '1-click export maps findings to Indian NCIIPC Critical Information Infrastructure guidelines, CERT-In directions, and IEC 62443-3-3 target security levels.',
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

        {/* The Vidura Difference: Clean 3-Card Comparison Strip */}
        <div className="mt-16 sm:mt-20 glass-card p-6 sm:p-8 rounded-3xl border border-white/[0.08] bg-[#120D0B]/80 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#F26A1B] font-semibold">
                THE VIDURA DIFFERENCE
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Why operational critical infrastructure requires a different engine.
              </h3>
            </div>
            <span className="text-xs font-mono text-[#6F6863] shrink-0">
              Zero fluff · Grounded in OT physics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Dimension 1: Remediation */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider font-mono">
                01 · REMEDIATION APPROACH
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                <div className="text-xs text-[#6F6863] flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 text-[#FF4D4F]" />
                  <span>Generic OT Scanners</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Advise firmware patching (demanding PLC reboots and plant shutdowns).
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F26A1B]/[0.08] border border-[#F26A1B]/30 space-y-1.5 shadow-[0_0_20px_rgba(242,106,27,0.08)]">
                <div className="text-xs text-[#F26A1B] font-semibold flex items-center gap-1.5 font-mono">
                  <Check className="w-3.5 h-3.5 text-[#3DDC97]" />
                  <span>Vidura Virtual Patches</span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed">
                  Generates drop-in Cisco ACL, FortiOS, and Suricata DPI rules with zero plant downtime.
                </p>
              </div>
            </div>

            {/* Dimension 2: Consequence Metric */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider font-mono">
                02 · RISK IMPACT METRIC
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                <div className="text-xs text-[#6F6863] flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 text-[#FF4D4F]" />
                  <span>Generic OT Scanners</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Abstract CVSS 9.8 scores and theoretical commercial dollar loss guesses.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F26A1B]/[0.08] border border-[#F26A1B]/30 space-y-1.5 shadow-[0_0_20px_rgba(242,106,27,0.08)]">
                <div className="text-xs text-[#F26A1B] font-semibold flex items-center gap-1.5 font-mono">
                  <Check className="w-3.5 h-3.5 text-[#3DDC97]" />
                  <span>Vidura Municipal SLAs</span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed">
                  Quantifies physical consequence: 140 MLD potable water lost &amp; 4.2h reserve buffer to dry taps.
                </p>
              </div>
            </div>

            {/* Dimension 3: Sovereign Compliance */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider font-mono">
                03 · STATUTORY COMPLIANCE
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                <div className="text-xs text-[#6F6863] flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 text-[#FF4D4F]" />
                  <span>Generic OT Scanners</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  US/EU-centric generic checklists (NIST/CIS) requiring manual spreadsheet mapping.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F26A1B]/[0.08] border border-[#F26A1B]/30 space-y-1.5 shadow-[0_0_20px_rgba(242,106,27,0.08)]">
                <div className="text-xs text-[#F26A1B] font-semibold flex items-center gap-1.5 font-mono">
                  <Check className="w-3.5 h-3.5 text-[#3DDC97]" />
                  <span>Vidura Sovereign Audit Binder</span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed">
                  1-click verified export mapped to Indian NCIIPC CII guidelines, CERT-In, &amp; IEC 62443 SL-3.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
