import { useState, useEffect } from 'react';
import { ArrowUpRight, Menu, X, Shield } from 'lucide-react';

export interface LandingNavProps {
  onLaunch?: () => void;
}

const NAV_LINKS = [
  { id: 'top', label: 'Home', href: '#top' },
  { id: 'problem', label: 'Problem', href: '#problem' },
  { id: 'method', label: 'Method', href: '#method' },
  { id: 'views', label: 'Views', href: '#views' },
  { id: 'capabilities', label: 'Capabilities', href: '#capabilities' },
  { id: 'validation', label: 'Validation', href: '#validation' },
];

export default function LandingNav({ onLaunch }: LandingNavProps) {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('top');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Scroll listener (> 20px activates elevated background matching Header.tsx)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      if (window.scrollY < 120) {
        setActiveSection('top');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for section highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && window.scrollY >= 120) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -50% 0px',
        threshold: 0.1,
      }
    );

    NAV_LINKS.forEach((link) => {
      if (link.id !== 'top') {
        const el = document.getElementById(link.id);
        if (el) observer.observe(el);
      }
    });

    return () => observer.disconnect();
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
    if (href === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveSection('top');
      return;
    }
    const targetId = href.replace('#', '');
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-32px)] max-w-[1200px] transition-all duration-250 ease-out ${
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
            className="inline-flex items-center gap-1.5 rounded-full bg-[#F26A1B] px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white shadow-md shadow-[#F26A1B]/20 transition hover:bg-[#FF7A2B] focus:outline-none focus-visible:ring-2 ring-[#F26A1B]/60 shrink-0"
          >
            <span>Open Dashboard</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
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
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#F26A1B] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#FF7A2B] focus:outline-none focus-visible:ring-2 ring-[#F26A1B]/60"
            >
              <span>Open Dashboard</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
