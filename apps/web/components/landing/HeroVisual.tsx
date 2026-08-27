'use client';
import { motion, useReducedMotion } from 'framer-motion';

export function HeroVisual() {
  const prefersReducedMotion = useReducedMotion();
  
  // Generate 12 particles anchored to corners/edges (not random scatter)
  const particles = Array.from({ length: 12 }, (_, i) => {
    const quadrant = i % 4; // 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right
    const left = quadrant === 0 || quadrant === 2 ? 5 + (i * 7) % 20 : 75 + (i * 5) % 20;
    const top = quadrant === 0 || quadrant === 1 ? 10 + (i * 9) % 25 : 65 + (i * 7) % 25;
    return {
      id: i,
      left,
      top,
      size: 5 + (i % 5),
      color: ['var(--color-forest)', 'var(--color-forest-mid)', 'var(--color-forest-light)'][i % 3],
      duration: 6 + (i % 4),
      delay: (i * 0.3) % 2,
      xDrift: 15 + (i % 3) * 10,
      yDrift: 10 + (i % 3) * 8,
    };
  });

  return (
    <div className="hero-visual-fullscreen">
      {/* Solid glass white background */}
      <div className="hero-bg-solid" />
      
      {/* Animated green dots - organic drift with VISIBLE movement */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="hero-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
          }}
          animate={prefersReducedMotion ? undefined : {
            x: [0, p.xDrift, -p.xDrift / 2, 0],
            y: [0, -p.yDrift, p.yDrift / 2, 0],
            opacity: [0.5, 1, 0.6, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
