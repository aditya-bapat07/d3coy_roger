import React, { useEffect, useRef, useState } from 'react';

interface ParallaxLayerProps {
  depth?: number;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  depth = 0.5,
  className = '',
  children,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(true);

  const targetOffset = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Disable on touch devices and honor prefers-reduced-motion
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || prefersReducedMotion) {
      setEnabled(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const normX = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
      const normY = (e.clientY / innerHeight - 0.5) * 2;

      // Max movement ~25px scaled by depth
      const maxDisplacement = 25;
      targetOffset.current = {
        x: -normX * maxDisplacement * depth,
        y: -normY * maxDisplacement * depth,
      };
    };

    const animate = () => {
      // Lerp smoothing (linear interpolation)
      const lerpFactor = 0.08;
      currentOffset.current.x += (targetOffset.current.x - currentOffset.current.x) * lerpFactor;
      currentOffset.current.y += (targetOffset.current.y - currentOffset.current.y) * lerpFactor;

      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${currentOffset.current.x.toFixed(2)}px, ${currentOffset.current.y.toFixed(2)}px, 0)`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [depth]);

  if (!enabled) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        willChange: 'transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
