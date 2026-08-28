"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { mockCampusRepo, type Campus } from "@voeq/data";

export function HeroSection() {
  const router = useRouter();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    mockCampusRepo.list().then((rows) => {
      setCampuses(rows.filter((c) => c.status === "verified"));
    });
  }, []);

  return (
    <section className="hero">
      {/* Warm gradient background with texture */}
      <div className="hero-bg" />

      {/* Campus illustration */}
      <div className="hero-illustration" aria-hidden="true">
        <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stylized campus buildings */}
          <rect x="100" y="300" width="120" height="200" rx="8" fill="#1e3b2f" opacity="0.1"/>
          <rect x="240" y="250" width="100" height="250" rx="8" fill="#1e3b2f" opacity="0.08"/>
          <rect x="360" y="320" width="140" height="180" rx="8" fill="#1e3b2f" opacity="0.12"/>
          <rect x="520" y="280" width="110" height="220" rx="8" fill="#1e3b2f" opacity="0.09"/>
          
          {/* Trees */}
          <circle cx="180" cy="420" r="30" fill="#2d5a3d" opacity="0.15"/>
          <circle cx="420" cy="400" r="35" fill="#2d5a3d" opacity="0.12"/>
          <circle cx="600" cy="430" r="28" fill="#2d5a3d" opacity="0.14"/>
          
          {/* Students (stylized) */}
          <circle cx="200" cy="380" r="8" fill="#D4A054" opacity="0.3"/>
          <rect x="196" y="390" width="8" height="20" rx="4" fill="#1e3b2f" opacity="0.2"/>
          
          <circle cx="450" cy="370" r="8" fill="#D4A054" opacity="0.25"/>
          <rect x="446" y="380" width="8" height="20" rx="4" fill="#1e3b2f" opacity="0.2"/>
          
          <circle cx="650" cy="390" r="8" fill="#D4A054" opacity="0.3"/>
          <rect x="646" y="400" width="8" height="20" rx="4" fill="#1e3b2f" opacity="0.2"/>
          
          {/* Marketplace stall */}
          <rect x="300" y="450" width="80" height="50" rx="4" fill="#D4A054" opacity="0.2"/>
          <rect x="310" y="440" width="60" height="10" rx="2" fill="#D4A054" opacity="0.3"/>
        </svg>
      </div>

      <div className="hero-content">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="hero-eyebrow"
        >
          <span className="hero-eyebrow-dot" />
          <span>your campus, in motion</span>
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={mounted ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="hero-headline"
        >
          Your campus.
          <br />
          <span className="hero-headline-accent">Your marketplace.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="hero-subheadline"
        >
          Discover, buy, and sell with students on your own campus.
          <br />
          From textbooks to tutoring, food to fashion — find what you need from people you know.
        </motion.p>

        {/* Single CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="hero-cta"
        >
          <button
            onClick={() => router.push("/explore")}
            className="hero-cta-btn"
          >
            Explore your campus
          </button>
        </motion.div>

        {/* Trust signal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="hero-trust"
        >
          <span className="hero-trust-item">{campuses.length} campuses</span>
          <span className="hero-trust-divider">·</span>
          <span className="hero-trust-item">0 vendors</span>
          <span className="hero-trust-divider">·</span>
          <span className="hero-trust-item hero-trust-cta">Be the first to list</span>
        </motion.div>
      </div>
    </section>
  );
}
