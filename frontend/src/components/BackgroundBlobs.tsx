import React, { useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ParallaxLayer } from './ParallaxLayer';

interface BackgroundBlobsProps {
  currentTab: 'risk' | 'graph' | 'remediation' | 'how';
}

export const BackgroundBlobs: React.FC<BackgroundBlobsProps> = ({ currentTab }) => {
  const { scrollYProgress } = useScroll();

  // Scroll-synced transforms
  const blob1Y = useTransform(scrollYProgress, [0, 0.5, 1], [0, 180, 80]);
  const blob1X = useTransform(scrollYProgress, [0, 0.5, 1], [0, 90, -40]);
  const blob1Scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.25, 0.9]);

  const blob2Y = useTransform(scrollYProgress, [0, 0.5, 1], [0, -120, -220]);
  const blob2X = useTransform(scrollYProgress, [0, 0.5, 1], [0, -70, 60]);
  const blob2Scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.85, 1.2]);

  const blob3Y = useTransform(scrollYProgress, [0, 0.5, 1], [0, 100, -80]);
  const blob3Rotate = useTransform(scrollYProgress, [0, 1], [0, 180]);

  const blob4Y = useTransform(scrollYProgress, [0, 0.5, 1], [0, -90, 70]);

  // Tab shift offsets when page doesn't scroll much
  const tabOffsets = useMemo(() => {
    switch (currentTab) {
      case 'risk':
        return { b1: { x: 0, y: 0 }, b2: { x: 0, y: 0 }, b3: { x: 0, y: 0 } };
      case 'graph':
        return { b1: { x: 120, y: -40 }, b2: { x: -80, y: 60 }, b3: { x: 60, y: 40 } };
      case 'remediation':
        return { b1: { x: -60, y: 80 }, b2: { x: 90, y: -50 }, b3: { x: -40, y: -60 } };
      case 'how':
        return { b1: { x: 40, y: -90 }, b2: { x: -100, y: -40 }, b3: { x: 80, y: 70 } };
      default:
        return { b1: { x: 0, y: 0 }, b2: { x: 0, y: 0 }, b3: { x: 0, y: 0 } };
    }
  }, [currentTab]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0A0706]"
    >
      <ParallaxLayer depth={0.25} className="absolute inset-0">
        {/* Blob 1: Primary orange (#F26A1B) */}
        <motion.div
          animate={{
            x: tabOffsets.b1.x,
            y: tabOffsets.b1.y,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            x: blob1X,
            y: blob1Y,
            scale: blob1Scale,
            filter: 'blur(130px)',
          }}
          className="absolute -top-24 -left-20 w-[550px] h-[550px] rounded-full bg-[#F26A1B]/20"
        />

        {/* Blob 2: Deep Red-Orange (#C0392B) */}
        <motion.div
          animate={{
            x: tabOffsets.b2.x,
            y: tabOffsets.b2.y,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            x: blob2X,
            y: blob2Y,
            scale: blob2Scale,
            filter: 'blur(140px)',
          }}
          className="absolute top-1/4 -right-28 w-[600px] h-[600px] rounded-full bg-[#B83A14]/18"
        />

        {/* Blob 3: Burgundy brown (#3D1B10) */}
        <motion.div
          animate={{
            x: tabOffsets.b3.x,
            y: tabOffsets.b3.y,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            y: blob3Y,
            rotate: blob3Rotate,
            filter: 'blur(150px)',
          }}
          className="absolute bottom-10 left-1/3 w-[500px] h-[500px] rounded-full bg-[#3D1B10]/25"
        />

        {/* Blob 4: Faint warm amber (#D97706) */}
        <motion.div
          style={{
            y: blob4Y,
            filter: 'blur(130px)',
          }}
          className="absolute bottom-1/4 -left-24 w-[450px] h-[450px] rounded-full bg-[#D97706]/15"
        />
      </ParallaxLayer>

      {/* Faint grain overlay (~3% opacity) */}
      <div className="absolute inset-0 bg-grain pointer-events-none opacity-40 mix-blend-screen" />
    </div>
  );
};
