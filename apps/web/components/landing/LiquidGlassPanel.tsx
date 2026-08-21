'use client';
import { motion, useReducedMotion } from 'framer-motion';

interface LiquidGlassPanelProps {
  children: React.ReactNode;
  breathDuration?: number; // seconds, default 12
  delay?: number; // seconds
  className?: string;
}

export function LiquidGlassPanel({ 
  children, 
  breathDuration = 12, 
  delay = 0,
  className = '' 
}: LiquidGlassPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`liquid-glass-panel ${className}`}
      animate={shouldReduceMotion ? {} : {
        scale: [1, 1.015, 1],
        opacity: [0.95, 1, 0.95],
      }}
      transition={{
        duration: breathDuration,
        delay,
        repeat: Infinity,
        ease: [0.4, 0, 0.6, 1],
      }}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), var(--shadow-glass)',
        padding: 'var(--space-lg) var(--space-4)',
      }}
    >
      {children}
    </motion.div>
  );
}
