import { useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion';

export default function AmbientBackground() {
  const prefersReduced = useReducedMotion();

  // LAYER 1: Dot grid parallax scroll
  const { scrollY } = useScroll();
  const gridY = useTransform(scrollY, (v) => (prefersReduced ? 0 : v * 0.3));

  // LAYER 2: Cursor-tracking spotlight
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  // Smooth lag with stiffness: 50, damping: 30
  const springConfig = { stiffness: 50, damping: 30 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const [isHoveringWindow, setIsHoveringWindow] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setIsHoveringWindow(true);
    };

    const handleMouseLeave = () => {
      setIsHoveringWindow(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('blur', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('blur', handleMouseLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* LAYER 1 — Dot grid (1px dots, 48px spacing, shifts vertically at 0.3x scroll) */}
      <motion.div
        className="absolute inset-x-0 -top-[5000px] -bottom-[5000px] pointer-events-none"
        style={{
          y: gridY,
          backgroundImage:
            'radial-gradient(circle, rgba(242, 106, 27, 0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* LAYER 2 — Cursor-tracking spotlight (600px radius, 400ms fade on leave) */}
      <motion.div
        className="absolute -top-[600px] -left-[600px] w-[1200px] h-[1200px] rounded-full pointer-events-none"
        animate={{
          opacity: isHoveringWindow && !prefersReduced ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          x: smoothX,
          y: smoothY,
          background:
            'radial-gradient(circle 600px at center, rgba(242, 106, 27, 0.07) 0%, transparent 100%)',
        }}
      />

      {/* LAYER 3 — Two ambient orbs */}
      {/* Top-right orb: 500px, rgba(242,106,27,0.04), blurred 120px */}
      <motion.div
        className="absolute -top-[120px] -right-[120px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'rgba(242, 106, 27, 0.04)',
          filter: 'blur(120px)',
          WebkitFilter: 'blur(120px)',
        }}
        animate={prefersReduced ? undefined : { y: [-20, 20] }}
        transition={{
          duration: 8,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />

      {/* Bottom-left orb: 400px, rgba(61,220,151,0.03), blurred 100px, offset by 4s */}
      <motion.div
        className="absolute -bottom-[100px] -left-[100px] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'rgba(61, 220, 151, 0.03)',
          filter: 'blur(100px)',
          WebkitFilter: 'blur(100px)',
        }}
        animate={prefersReduced ? undefined : { y: [-20, 20] }}
        transition={{
          duration: 8,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'reverse',
          delay: 4,
        }}
      />
    </div>
  );
}

