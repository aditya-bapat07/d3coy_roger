import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Menu, X, Shield } from 'lucide-react';

export interface LandingNavProps {
  onLaunch?: () => void;
}

const NAV_LINKS = [
  { id: 'top', label: 'Home', href: '#top' },
  { id: 'problem', label: 'Problem', href: '#problem' },
  { id: 'method', label: 'Method', href: '#method' },
  { id: 'capabilities', label: 'Capabilities', href: '#capabilities' },
  { id: 'personas', label: 'Personas', href: '#personas' },
];

const SECTION_IDS = ['problem', 'method', 'capabilities', 'personas'] as const;

export default function LandingNav({ onLaunch }: LandingNavProps) {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('top');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const isManualScrollRef = useRef<boolean>(false);
  const manualScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reliable scroll position listener for navbar background elevation and section spy
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Do not let scroll listener override active selection during manual smooth-scroll animation
      if (isManualScrollRef.current) return;

      if (window.scrollY < 120) {
        setActiveSection('top');
        return;
      }

      // If user reaches near the bottom of the page, activate the last section
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 80
      ) {
        setActiveSection('personas');
        return;
      }

      // Check sections from bottom to top; the first one whose top is at or above the upper viewport threshold is active
      const navOffset = 220;
      for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
        const id = SECTION_IDS[i];
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= navOffset) {
            setActiveSection(id);
            return;
          }
        }
      }

      setActiveSection('top');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
    };
  }, []);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [mobileMenuOpen]);

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    const targetId = href.replace('#', '');

    // Immediately highlight the selected item in the nav bar
    setActiveSection(targetId);

    // Lock scroll spy temporarily while smooth scrolling
    isManualScrollRef.current = true;
    if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
    manualScrollTimerRef.current = setTimeout(() => {
      isManualScrollRef.current = false;
    }, 1000);

    if (href === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-[1200px] transition-all duration-250 ease-out ${
        mobileMenuOpen ? 'rounded-3xl' : 'rounded-full'
      } ${isScrolled ? 'floating-nav-scrolled py-2' : 'floating-nav py-2.5 sm:py-3'}`}
    >
      <div className="w-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand with Orange Shield (Identical to Vivaan-feature Header) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('#top');
          }}
          className="flex items-center gap-2.5 shrink-0 select-none group focus:outline-none focus-visible:ring-2 ring-[#F26A1B]/60 rounded-lg"
          aria-label="Vidura Home"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F26A1B]/20 to-[#FF7A2B]/10 border border-[#F26A1B]/30 flex items-center justify-center shadow-[0_0_15px_rgba(242,106,27,0.25)] group-hover:border-[#F26A1B]/60 transition-colors">
            <Shield className="w-4 h-4 text-[#F26A1B]" />
          </div>
          <span
            className="font-semibold text-lg tracking-tight text-white group-hover:text-white/90"
            style={{ letterSpacing: '-0.02em' }}
          >
            Vidura
          </span>
        </a>

        {/* Center Navigation Tabs (Desktop — identical pill styling to Header) */}
        <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-full bg-white/[0.02] border border-white/[0.04]">
          {NAV_LINKS.map((link) => {
            const active =
              (link.id === 'top' && activeSection === 'top') ||
              activeSection === link.id;

            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleLinkClick(link.href)}
                className={`relative px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 ring-[#F26A1B]/60 ${
                  active
                    ? 'text-[#F26A1B] bg-[#F26A1B]/15 border border-[#F26A1B]/40 shadow-[0_0_12px_rgba(242,106,27,0.25)] font-semibold'
                    : 'text-[#A09A96] hover:text-white border border-transparent hover:bg-white/[0.04]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Side Actions: Launch Dashboard + Mobile Hamburger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onLaunch}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#F26A1B] hover:bg-white text-white hover:text-[#120D0B] px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold shadow-md shadow-[#F26A1B]/25 hover:shadow-[0_0_22px_rgba(255,255,255,0.4)] transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 ring-white/60 shrink-0 cursor-pointer"
          >
            {/* Incoming left arrow on hover */}
            <span className="inline-flex items-center justify-center -translate-x-3 opacity-0 w-0 group-hover:w-3.5 group-hover:mr-1.5 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out">
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </span>

            {/* Label */}
            <span className="select-none tracking-tight">Open Dashboard</span>

            {/* Outgoing right arrow on hover */}
            <span className="inline-flex items-center justify-center ml-1.5 translate-x-0 opacity-100 w-3.5 group-hover:translate-x-3 group-hover:opacity-0 group-hover:w-0 group-hover:ml-0 transition-all duration-300 ease-out">
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </span>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="p-1.5 rounded-full text-[#A09A96] hover:text-white focus:outline-none focus-visible:ring-2 ring-[#F26A1B]/60 lg:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Sheet */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/[0.08] px-4 py-4 space-y-3 bg-[#120D0B]/95 rounded-b-2xl mt-2">
          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => {
              const active =
                (link.id === 'top' && activeSection === 'top') ||
                activeSection === link.id;

              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleLinkClick(link.href)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-[#F26A1B] bg-[#F26A1B]/15 font-semibold'
                      : 'text-[#A09A96] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunch?.();
              }}
              className="group w-full inline-flex items-center justify-center overflow-hidden rounded-xl bg-[#F26A1B] hover:bg-white px-4 py-2.5 text-xs font-semibold text-white hover:text-[#120D0B] transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 ring-white/60 cursor-pointer"
            >
              <span className="inline-flex items-center justify-center -translate-x-3 opacity-0 w-0 group-hover:w-3.5 group-hover:mr-1.5 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </span>
              <span>Open Dashboard</span>
              <span className="inline-flex items-center justify-center ml-1.5 translate-x-0 opacity-100 w-3.5 group-hover:translate-x-3 group-hover:opacity-0 group-hover:w-0 group-hover:ml-0 transition-all duration-300 ease-out">
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
