"use client";

import { useState, useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { campuses } from "@voeq/data";

/**
 * CampusSelector — dropdown to switch campus on explore page.
 * Persists selection to localStorage and triggers page reload with new campus context.
 */

interface CampusSelectorProps {
  currentCampus: string;
  onChange: (campusId: string) => void;
}

export function CampusSelector({ currentCampus, onChange }: CampusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if mobile viewport
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentCampusData = campuses.find(c => c.id === currentCampus) || campuses[0];
  
  // Abbreviate long campus names on mobile
  const displayName = isMobile && currentCampusData.name.length > 20
    ? currentCampusData.name.split(' ').map(w => w[0]).join('')
    : currentCampusData.name;

  const handleSelect = (campusId: string) => {
    if (mounted) {
      localStorage.setItem("voeq:preferred-campus", campusId);
    }
    onChange(campusId);
    setIsOpen(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        data-testid="campus-selector-trigger"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "var(--glass-bg)",
          backdropFilter: "var(--glass-blur)",
          WebkitBackdropFilter: "var(--glass-blur)",
          border: "1px solid var(--glass-border)",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          color: "var(--color-ink-deep)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--color-forest)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--glass-border)";
        }}
      >
        <MapPin size={16} style={{ color: "var(--color-forest)" }} />
        <span>{displayName}</span>
        <ChevronDown 
          size={16} 
          style={{ 
            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s ease"
          }} 
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />
          
          {/* Menu */}
          <div
            data-testid="campus-selector-menu"
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              minWidth: 280,
              maxHeight: 400,
              overflowY: "auto",
              background: "white",
              border: "1px solid var(--glass-border)",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
              zIndex: 1000,
              padding: 8,
            }}
          >
            {campuses.map((campus) => (
              <button
                key={campus.id}
                onClick={() => handleSelect(campus.id)}
                data-testid={`campus-option-${campus.id}`}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 16px",
                  background: campus.id === currentCampus ? "var(--color-cream)" : "transparent",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (campus.id !== currentCampus) {
                    e.currentTarget.style.background = "var(--color-cream-light)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 
                    campus.id === currentCampus ? "var(--color-cream)" : "transparent";
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-ink-deep)", marginBottom: 2 }}>
                  {campus.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>
                  {campus.city}, {campus.state}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
