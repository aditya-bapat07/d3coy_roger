import React, { useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useReducedMotion,
} from 'framer-motion';

interface ProblemCardData {
  id: string;
  title: string;
  body: string;
  stat: string;
  accentColor: string;
  icon: React.ReactNode;
}

const PROBLEM_CARDS: ProblemCardData[] = [
  {
    id: 'legacy-zero-day',
    title: 'Legacy meets zero-day',
    body: 'SCADA systems designed in the 1990s now face nation-state threat actors with AI-assisted exploit chains.',
    stat: '68% of ICS vulnerabilities have no patch',
    accentColor: '#FF4D4F',
    icon: (
      <svg
        className="w-7 h-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FF4D4F"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 20h20" />
        <path d="M4 20V10l7 4V8l7 4v8" />
        <path d="M14 4h4v4" />
        <path d="M9 16h2" />
        <path d="M15 16h2" />
      </svg>
    ),
  },
  {
    id: 'cascading-failures',
    title: 'Cascading failures are invisible',
    body: 'A compromised historian server doesn’t just lose logs — it blinds every operator to what the PLCs are doing downstream.',
    stat: '4.2 hrs average detection time',
    accentColor: '#FF7A2B',
    icon: (
      <svg
        className="w-7 h-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FF7A2B"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
  {
    id: 'finite-budgets',
    title: 'Remediation budgets are finite',
    body: 'You can’t patch everything. The question is which fix prevents the most damage per engineering hour spent.',
    stat: '23% of fixes cover 81% of risk',
    accentColor: '#FFC24B',
    icon: (
      <svg
        className="w-7 h-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FFC24B"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.11 1.17" />
        <path d="M4.73 4.73 4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ),
  },
];

interface ProblemCardItemProps {
  card: ProblemCardData;
  index: number;
  prefersReduced: boolean | null;
}

function ProblemCardItem({ card, index, prefersReduced }: ProblemCardItemProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });

  // Raw normalized mouse offset (-1 to 1) from card center
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Spring smoothing for 3D tilt & smooth spring reset on mouseleave
  const springConfig = { stiffness: 200, damping: 20 };
  const mouseXSpring = useSpring(rawX, springConfig);
  const mouseYSpring = useSpring(rawY, springConfig);

  // Max 8 degrees rotation
  const rotateX = useTransform(mouseYSpring, [-1, 1], [8, -8]);
  const rotateY = useTransform(mouseXSpring, [-1, 1], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSpotlightPos({ x, y });

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const normX = Math.max(-1, Math.min(1, (x - centerX) / centerX));
    const normY = Math.max(-1, Math.min(1, (y - centerY) / centerY));

    rawX.set(normX);
    rawY.set(normY);
  };

  const handleMouseEnter = () => {
    if (prefersReduced) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rawX.set(0);
    rawY.set(0);
  };

  // 200px radial spotlight inside the card surface
  const backgroundStyle =
    isHovered && !prefersReduced
      ? `radial-gradient(200px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(242, 106, 27, 0.08) 0%, transparent 100%), rgba(18, 13, 11, 0.85)`
      : 'rgba(18, 13, 11, 0.85)';

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 40 }}
      whileInView={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: prefersReduced ? 0.3 : 0.6,
        delay: prefersReduced ? 0 : index * 0.12,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      style={{ perspective: 1000 }}
      className="h-full"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        animate={{ scale: isHovered && !prefersReduced ? 1.02 : 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          rotateX: prefersReduced ? 0 : rotateX,
          rotateY: prefersReduced ? 0 : rotateY,
          transformStyle: 'preserve-3d',
          background: backgroundStyle,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border:
            isHovered && !prefersReduced
              ? '1px solid rgba(242, 106, 27, 0.32)'
              : '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow:
            isHovered && !prefersReduced
              ? '0 16px 36px -8px rgba(242, 106, 27, 0.16)'
              : 'none',
        }}
        className="relative flex flex-col justify-between h-full rounded-[20px] p-8 text-left transition-colors duration-200"
      >
        {/* Top: Icon + Title + Body */}
        <div>
          {/* Icon container */}
          <div
            className="inline-flex items-center justify-center p-3 rounded-xl border"
            style={{
              backgroundColor: `${card.accentColor}12`,
              borderColor: `${card.accentColor}28`,
            }}
          >
            {card.icon}
          </div>

          {/* Title */}
          <h3 className="h-display mt-6 text-xl sm:text-2xl text-white font-bold">
            {card.title}
          </h3>

          {/* Body */}
          <p className="mt-3 text-sm text-[#A09A96] leading-relaxed">
            {card.body}
          </p>
        </div>

        {/* Bottom: Stat Badge in glass-pill style with accent color */}
        <div className="mt-8 pt-4 border-t border-white/[0.04]">
          <div
            className="glass-pill inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-medium"
            style={{
              color: card.accentColor,
              borderColor: `${card.accentColor}30`,
              backgroundColor: `${card.accentColor}10`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: card.accentColor }}
            />
            <span>{card.stat}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ProblemCards() {
  const prefersReduced = useReducedMotion();

  return (
    <section id="problem" className="landing-section scroll-mt-24">
      <div className="landing-container">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          {/* Eyebrow */}
          <div className="glass-pill inline-flex items-center gap-2 px-3.5 py-1.5 text-xs text-[#F26A1B] border border-white/[0.08] font-mono tracking-wider uppercase font-semibold">
            <span>THE PROBLEM</span>
          </div>

          {/* Headline */}
          <h2 className="h-display mt-5 text-3xl sm:text-4xl lg:text-5xl text-white max-w-3xl leading-[1.12]">
            Critical infrastructure wasn’t built for the internet.{' '}
            <span className="text-[#A09A96]">Now it’s connected anyway.</span>
          </h2>
        </div>

        {/* Problem Cards 3D Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 sm:mt-16 items-stretch">
          {PROBLEM_CARDS.map((card, index) => (
            <ProblemCardItem
              key={card.id}
              card={card}
              index={index}
              prefersReduced={prefersReduced}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
