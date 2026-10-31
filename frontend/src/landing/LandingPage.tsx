import AmbientBackground from './sections/AmbientBackground';
import LandingNav from './sections/LandingNav';
import Hero from './sections/Hero';
import ProblemCards from './sections/ProblemCards';
import HowItWorks from './sections/HowItWorks';
import Views from './sections/Views';
import Capabilities from './sections/Capabilities';
import Validation from './sections/Validation';
import Personas from './sections/Personas';
import Footer from './sections/Footer';
import { PersonaType } from '../types/api';

export default function LandingPage({
  onLaunch,
  onLaunchTab,
  onThreatDemo,
  onLaunchPersona,
}: {
  onLaunch: () => void;
  onLaunchTab: (tab: 'risk' | 'graph' | 'remediation' | 'how') => void;
  onThreatDemo: () => void;
  onLaunchPersona?: (persona: PersonaType) => void;
}) {
  return (
    <div id="top" className="relative min-h-screen bg-[#0A0706] text-white overflow-x-clip">
      {/* Full-viewport ambient background layer (fixed, z-0, pointer-events: none) */}
      <AmbientBackground />

      {/* Floating navigation pill (fixed, z-50) */}
      <LandingNav onLaunch={onLaunch} />

      {/* Landing page sections (relative, z-1) */}
      <div className="relative z-[1]">
        <Hero onLaunch={onLaunch} onThreatDemo={onThreatDemo} />
        <ProblemCards />
        <HowItWorks />
        <Views onLaunchTab={onLaunchTab} />
        <Capabilities />
        <Validation />
        <Personas onLaunchPersona={onLaunchPersona} />
        <Footer />
      </div>
    </div>
  );
}
