'use client';
import { motion, useReducedMotion } from 'framer-motion';

export function HeroVisual() {
  const prefersReducedMotion = useReducedMotion();
  
  console.log('HeroVisual rendering, prefersReducedMotion:', prefersReducedMotion);
  
  // Generate 25 particles with unique properties - GREEN shades with BIG movement
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: (i * 4.1) % 100,
    top: (i * 5.7) % 100,
    size: 8 + (i % 5) * 4, // 8-28px - very visible
    color: ['#0F2A1D', '#1A3D2A', '#2D5A3D', '#4A7A5C'][i % 4], // Forest green shades
    duration: 8 + (i % 3) * 2, // Faster: 8-14 seconds (was 10-28)
    delay: i * 0.15, // Shorter delay
    xRange: 80 + (i % 4) * 40, // HUGE movement: 80-200px horizontal
    yRange: 60 + (i % 3) * 40, // HUGE movement: 60-140px vertical
  }));

  return (
    <div className="hero-visual-fullscreen">
      {/* Solid glass white background - covers entire hero */}
      <div className="hero-bg-solid" />
      
      {/* Optional: subtle topographic contour lines */}
      <svg className="hero-contours" viewBox="0 0 1440 800" preserveAspectRatio="none">
        <path 
          d="M0,300 Q360,250 720,300 T1440,300" 
          stroke="rgba(74,122,92,0.3)" 
          strokeWidth="1" 
          fill="none" 
        />
        <path 
          d="M0,450 Q360,400 720,450 T1440,450" 
          stroke="rgba(74,122,92,0.25)" 
          strokeWidth="1" 
          fill="none" 
        />
        <path 
          d="M0,600 Q360,550 720,600 T1440,600" 
          stroke="rgba(74,122,92,0.2)" 
          strokeWidth="1" 
          fill="none" 
        />
      </svg>
      
      {/* Animated green dots/particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="hero-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
          }}
          animate={prefersReducedMotion ? {} : {
            x: [0, p.xRange, -p.xRange / 2, 0],
            y: [0, -p.yRange, p.yRange / 2, 0],
            opacity: [0.7, 1, 0.8, 0.7],
            scale: [1, 1.2, 0.95, 1],
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
