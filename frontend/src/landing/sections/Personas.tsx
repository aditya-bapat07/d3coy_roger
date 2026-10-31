import { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { PersonaType } from '../../types/api';

export interface PersonaData {
  id: PersonaType;
  number: string;
  role: string;
  badge: string;
  badgeColor: string;
  entryPoints: string;
  maxHops: string;
  description: string;
  traits: string[];
}

const PERSONAS: PersonaData[] = [
  {
    id: 'nation_state',
    number: '01',
    role: 'Nation-state APT',
    badge: 'State-Sponsored APT',
    badgeColor: '#FF4D4F',
    entryPoints: 'Internet + Vendor VPN',
    maxHops: 'Up to 8 hops',
    description:
      'Patient, well-resourced state-sponsored actors chaining multi-hop lateral movement through enterprise IT and DMZ into physical OT control layers.',
    traits: [
      'Unrestricted lateral chaining across all CVEs and 0-days',
      'Exploits third-party vendor VPN and dual-homed jump hosts',
      'Targets safety-instrumented PLCs, water distribution, and RTUs',
      'Prioritizes catastrophic cascading municipal disruption',
    ],
  },
  {
    id: 'opportunistic',
    number: '02',
    role: 'Opportunistic Attacker',
    badge: 'Automated / Ransomware',
    badgeColor: '#F26A1B',
    entryPoints: 'Direct Internet Exposure',
    maxHops: 'Capped at 3 hops',
    description:
      'Ransomware gangs and automated botnets scanning for exposed perimeter devices with known weaponized vulnerabilities or factory default passwords.',
    traits: [
      'Restricted to CISA KEV entries or high EPSS (≥ 0.1) exploits',
      'Targets exposed cellular modems, default credentials, and web panels',
      'Drops attack paths requiring complex manual ICS protocol craft',
      'Fast-moving perimeter threats exploiting unpatched perimeter assets',
    ],
  },
  {
    id: 'insider',
    number: '03',
    role: 'Malicious Insider',
    badge: 'Bypasses Perimeter',
    badgeColor: '#FFC24B',
    entryPoints: 'L4 Corporate Workstation',
    maxHops: 'Up to 6 hops',
    description:
      'Disgruntled operators, rogue contractors, or compromised corporate credentials operating directly from inside the organizational perimeter.',
    traits: [
      'Completely bypasses perimeter firewalls, NAT, and external defenses',
      '100% credential validity on internal administrative links',
      'Moves laterally from enterprise workstations toward SCADA servers',
      'Simulates privileged credential abuse targeting chemical and pump PLCs',
    ],
  },
];

interface PersonaCardProps {
  persona: PersonaData;
  index: number;
  scrollYProgress: any;
  prefersReduced: boolean | null;
  onLaunchPersona?: (persona: PersonaType) => void;
}

function PersonaCard({
  persona,
  index,
  scrollYProgress,
  prefersReduced,
  onLaunchPersona,
}: PersonaCardProps) {
  // Parallax depth offset:
  // Card 1 (index 0): moves up slightly faster (scrollProgress * -15px)
  // Card 2 (index 1): baseline (0)
  // Card 3 (index 2): moves up slightly slower (scrollProgress * 15px)
  const offsetMult = index === 0 ? -15 : index === 2 ? 15 : 0;
  const parallaxY = useTransform(
    scrollYProgress,
    (v: number) => (prefersReduced ? 0 : v * offsetMult)
  );

  return (
    <motion.div
      style={{ y: parallaxY }}
      className="h-full flex"
    >
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 32 }}
        whileInView={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{
          duration: prefersReduced ? 0.3 : 0.6,
          delay: prefersReduced ? 0 : index * 0.15,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
        style={{
          backgroundColor: 'rgba(18, 13, 11, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '24px',
          padding: '32px',
        }}
        className="group relative flex flex-col justify-between w-full h-full min-h-[460px] text-left transition-all duration-300 hover:border-[#F26A1B]/30 overflow-hidden shadow-lg hover:shadow-[0_0_24px_rgba(242,106,27,0.12)]"
      >
        {/* Subtle grain overlay on hover (30% opacity) */}
        <div className="absolute inset-0 rounded-[24px] bg-grain opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none -z-0" />

        {/* Large faded editorial background number ("01", "02", "03") */}
        <span
          className="absolute top-5 left-6 font-['Manrope'] font-extrabold text-6xl text-white/[0.04] select-none pointer-events-none leading-none -z-0"
          aria-hidden="true"
        >
          {persona.number}
        </span>

        {/* Top Badges & Role Information */}
        <div className="relative z-10 flex flex-col flex-1">
          {/* Header Badges */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border"
              style={{
                color: persona.badgeColor,
                borderColor: `${persona.badgeColor}40`,
                backgroundColor: `${persona.badgeColor}15`,
              }}
            >
              {persona.badge}
            </span>
            <span className="text-[10px] font-mono text-[#A09A96] bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
              {persona.maxHops}
            </span>
          </div>

          {/* Role Title */}
          <h3 className="pt-3 text-xl font-bold text-white tracking-tight">
            {persona.role}
          </h3>

          {/* Entry Point Line */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-mono text-[#F26A1B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F26A1B] shrink-0" />
            <span className="truncate">Entry: {persona.entryPoints}</span>
          </div>

          {/* Short Description */}
          <p className="mt-3 text-xs text-[#A09A96] leading-relaxed">
            {persona.description}
          </p>

          {/* Simulation Behavior Section */}
          <div className="mt-5 text-[11px] uppercase tracking-wider text-white/40 font-mono font-medium">
            Simulated Attack Profile:
          </div>

          {/* Bullet Points */}
          <ul className="mt-2.5 space-y-2 flex-1">
            {persona.traits.map((trait) => (
              <li key={trait} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F26A1B] shrink-0 mt-2" />
                <span className="text-xs text-white/70 leading-relaxed">
                  {trait}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Optional Interactive CTA Button */}
        {onLaunchPersona && (
          <div className="relative z-10 mt-6 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => onLaunchPersona(persona.id)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-semibold text-white/80 hover:text-white bg-white/[0.03] hover:bg-[#F26A1B]/15 border border-white/10 hover:border-[#F26A1B]/50 transition-all flex items-center justify-between group/btn shadow-sm"
            >
              <span>Simulate this persona</span>
              <span className="text-[#F26A1B] group-hover/btn:translate-x-1 transition-transform">
                →
              </span>
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function Personas({
  onLaunchPersona,
}: {
  onLaunchPersona?: (persona: PersonaType) => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // Scroll progress through the section for parallax depth
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  return (
    <section id="personas" ref={sectionRef} className="landing-section scroll-mt-24">
      <div className="landing-container">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          <div className="glass-pill inline-flex items-center gap-2 px-3.5 py-1.5 text-xs text-[#F26A1B] border border-white/[0.08] font-mono tracking-wider uppercase font-semibold">
            <span>ADVERSARY MODELING</span>
          </div>

          <h2 className="h-display mt-5 text-3xl sm:text-4xl lg:text-5xl text-white max-w-3xl leading-[1.12]">
            Simulate attacks across every adversary archetype.
          </h2>

          <p className="mt-4 text-[#A09A96] text-sm sm:text-base max-w-2xl leading-relaxed">
            Vidura evaluates risk, likelihood, and lateral reachability against three distinct threat actor profiles, matching real-world adversary capabilities from automated scanners to nation-state APTs.
          </p>
        </div>

        {/* Personas 3-Card Parallax Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-12 sm:mt-16 items-stretch">
          {PERSONAS.map((persona, index) => (
            <PersonaCard
              key={persona.number}
              persona={persona}
              index={index}
              scrollYProgress={scrollYProgress}
              prefersReduced={prefersReduced}
              onLaunchPersona={onLaunchPersona}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
