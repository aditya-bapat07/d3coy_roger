import { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HeroDiagram from '../HeroDiagram';

export interface HeroProps {
  onLaunch?: () => void;
  onThreatDemo?: () => void;
}

const METRO_CITIES = [
  'Navanagar',
  'Mumbai',
  'Delhi NCR',
  'Bengaluru',
  'Chennai',
  'Hyderabad',
  'Ahmedabad',
  'Kolkata',
  'Pune',
];

export default function Hero({ onLaunch, onThreatDemo }: HeroProps) {
  const [cityIndex, setCityIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCityIndex((prev) => (prev + 1) % METRO_CITIES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="hero" className="landing-section scroll-mt-24 min-h-[92vh] pt-28 sm:pt-32 pb-16 flex items-center overflow-x-clip">
      <div className="landing-container grid lg:grid-cols-[1.05fr_.95fr] items-center gap-10 lg:gap-12 w-full min-w-0">
        {/* Left Column: Headline and Actions */}
        <div className="flex flex-col items-start text-left w-full min-w-0">
          {/* Eyebrow Pill */}
          <div className="glass-pill inline-flex items-center gap-2 px-3.5 py-1.5 text-xs text-[#F26A1B] border border-white/[0.08] font-mono tracking-wider uppercase font-semibold">
            <span>PS 03 · Critical infrastructure cyber-risk</span>
          </div>

          {/* Headline with Gradient Dynamic Accent */}
          <h1 className="h-display mt-5 text-[clamp(2.4rem,5.6vw,4.4rem)] text-white">
            Know which cyber risk will hurt{' '}
            <span className="inline-block relative">
              <AnimatePresence mode="wait">
                <motion.span
                  key={METRO_CITIES[cityIndex]}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="inline-block bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #F26A1B 0%, #FF7A2B 50%, #FFC24B 100%)',
                    WebkitBackgroundClip: 'text',
                  }}
                >
                  {METRO_CITIES[cityIndex]}
                </motion.span>
              </AnimatePresence>
            </span>{' '}
            first.
          </h1>

          {/* Subtitle / Paragraph */}
          <p className="mt-6 text-[#A09A96] max-w-[52ch] text-base sm:text-lg leading-relaxed">
            Vidura scores every asset across metropolitan critical infrastructure by how likely it is to be breached
            and how many citizens lose service if it is — then tells you which fixes buy the most safety for the
            engineering hours you actually have.
          </p>

          {/* Action Buttons Row */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onLaunch}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F26A1B] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#F26A1B]/25 transition hover:bg-[#FF7A2B] focus:outline-none focus-visible:ring-2 ring-[#F26A1B]/60"
            >
              <span>Open the dashboard</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onThreatDemo}
              className="glass-pill inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 ring-[#F26A1B]/60"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF4D4F] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF4D4F]" />
              </span>
              <span>See a threat drop live</span>
            </button>
          </div>

          {/* Micro-line Under Buttons */}
          <p className="mt-4 text-xs text-[#6F6863] font-mono tracking-tight flex items-center gap-2 flex-wrap">
            <span>Offline-first</span>
            <span className="text-white/20">·</span>
            <span>Zero-Downtime Virtual Patches</span>
            <span className="text-white/20">·</span>
            <span>Physical MLD SLAs</span>
            <span className="text-white/20">·</span>
            <span>NCIIPC &amp; CERT-In Ready</span>
          </p>
        </div>

        {/* Right Column: Interactive Purdue Model Diagram */}
        <div className="w-full flex justify-center lg:justify-end min-w-0 overflow-visible">
          <HeroDiagram />
        </div>
      </div>
    </section>
  );
}
