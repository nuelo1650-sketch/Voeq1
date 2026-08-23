'use client';
import { motion, useReducedMotion } from 'framer-motion';

export function HeroVisual() {
  const prefersReducedMotion = useReducedMotion();
  
  // Generate 20 particles with better distribution and faster animation
  const particles = Array.from({ length: 20 }, (_, i) => {
    return {
      id: i,
      // Better organic scatter across full viewport
      left: 5 + (i * 41 + 17) % 90, // 5-95% spread
      top: 10 + (i * 37 + 23) % 80,  // 10-90% spread
      // Varied sizes 6-14px (more visible)
      size: 6 + (i % 9),
      // Three green shades from design system
      color: [
        'var(--color-forest)',      // #0F2A1D
        'var(--color-forest-mid)',  // #2D5A3D
        'var(--color-forest-light)' // #4A7A5C
      ][i % 3],
      // FASTER cycles: 4-8 seconds (was 8-20s)
      duration: 4 + (i % 5),
      // Quick stagger
      delay: (i * 0.2) % 2,
      // BIGGER movement ranges for visibility
      xDrift: 40 + (i % 4) * 20,  // 40-100px horizontal
      yDrift: 30 + (i % 3) * 15,  // 30-60px vertical
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
