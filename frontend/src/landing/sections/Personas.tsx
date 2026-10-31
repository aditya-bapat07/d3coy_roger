import { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';

interface PersonaData {
  number: string;
  role: string;
  caresAbout: string[];
}

const PERSONAS: PersonaData[] = [
  {
    number: '01',
    role: 'CISO / Security Head',
    caresAbout: [
      'Board-ready risk posture reporting',
      'Compliance mapping to IEC 62443 and NIST CSF',
      'Quantified risk reduction from each remediation investment',
      'Audit trail for every prioritisation decision',
    ],
  },
  {
    number: '02',
    role: 'OT / Plant Engineer',
    caresAbout: [
      'Which PLCs and HMIs are actually exposed right now',
      'Remediation steps that don’t require a maintenance window',
      'Impact simulation before touching production systems',
      'Plain-language explanations, not security jargon',
    ],
  },
  {
    number: '03',
    role: 'City Administrator / Municipal Commissioner',
    caresAbout: [
      'Citizen impact numbers — how many people lose water or power',
      'Cost-per-risk-point-reduced for budget justification',
      'Executive dashboard without needing a cybersecurity background',
      'Compliance status for central government mandates',
    ],
  },
];

interface PersonaCardProps {
  persona: PersonaData;
  index: number;
  scrollYProgress: any;
  prefersReduced: boolean | null;
}

function PersonaCard({
  persona,
  index,
  scrollYProgress,
  prefersReduced,
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
      className="h-full"
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
          padding: '36px',
        }}
        className="group relative flex flex-col justify-between h-full min-h-[360px] text-left transition-all duration-300 hover:border-[#F26A1B]/20 overflow-hidden"
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

        {/* Card Content */}
        <div className="relative z-10">
          {/* Role Title */}
          <h3 className="pt-4 text-lg font-bold text-white tracking-tight">
            {persona.role}
          </h3>

          {/* Cares About Label */}
          <div className="mt-6 text-xs uppercase tracking-widest text-white/30 font-mono font-medium">
            Cares about:
          </div>

          {/* Bullet Points */}
          <ul className="mt-3 space-y-2">
            {persona.caresAbout.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F26A1B] shrink-0 mt-[11px]" />
                <span className="text-sm text-white/[0.55] leading-[2]">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Personas() {
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
            <span>WHO IT’S FOR</span>
          </div>

          <h2 className="h-display mt-5 text-3xl sm:text-4xl lg:text-5xl text-white max-w-3xl leading-[1.12]">
            One platform, every stakeholder in the room.
          </h2>
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
            />
          ))}
        </div>
      </div>
    </section>
  );
}
