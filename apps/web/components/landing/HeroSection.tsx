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
      {/* Warm gradient background */}
      <div className="hero-bg" />

      {/* Floating orbs for depth */}
      <div className="hero-orbs" aria-hidden="true">
        <div className="hero-orb hero-orb--1" />
        <div className="hero-orb hero-orb--2" />
        <div className="hero-orb hero-orb--3" />
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
          Find your people.
          <br />
          <span className="hero-headline-accent">Find your stuff.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="hero-subheadline"
        >
          The campus marketplace where Nigerian students discover, buy, and sell — all in one place.
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
            Get started
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
