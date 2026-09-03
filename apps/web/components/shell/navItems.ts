import type { LucideIcon } from "lucide-react";
import { Home, Search, Bookmark, MessageSquare, User, LayoutDashboard, Package, BarChart3, Users, ShieldCheck, FileText, Settings as SettingsIcon, SlidersHorizontal, ScrollText } from "lucide-react";

export type AppRole = "shopper" | "vendor" | "staff";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Optional short tag rendered next to the label (e.g. staff role name). */
  badge?: string;
}

/**
 * Primary (bottom-tab) nav per role. These are the actions a user hits most.
 * Staff uses a left sidebar instead of a bottom-tab (dense desktop tool).
 */
export const PRIMARY_NAV: Record<AppRole, NavItem[]> = {
  shopper: [
    { href: "/home", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Search },
    { href: "/saved", label: "Saved", icon: Bookmark },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/settings", label: "You", icon: User },
  ],
  vendor: [
    { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/vendor/listings", label: "Listings", icon: Package },
    { href: "/vendor/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/settings", label: "You", icon: User },
  ],
  staff: [],
};

/** Desktop left-sidebar nav per role (shopper + vendor). Mirrors PRIMARY_NAV. */
export const SIDE_NAV: Record<Exclude<AppRole, "staff">, NavItem[]> = {
  shopper: [
    { href: "/home", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Search },
    { href: "/saved", label: "Saved", icon: Bookmark },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/settings", label: "You", icon: User },
  ],
  vendor: [
    { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/vendor/listings", label: "Listings", icon: Package },
    { href: "/vendor/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/explore", label: "Explore", icon: Search },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/settings", label: "You", icon: User },
  ],
};

/** Center (desktop top-bar) nav per role. */
export const CENTER_NAV: Record<AppRole, NavItem[]> = {
  shopper: [
    { href: "/home", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Search },
    { href: "/messages", label: "Messages", icon: MessageSquare },
  ],
  vendor: [
    { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/vendor/listings/create", label: "Listings", icon: Package },
    { href: "/vendor/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/messages", label: "Messages", icon: MessageSquare },
  ],
  staff: [
    { href: "/staff", label: "Overview", icon: LayoutDashboard },
    { href: "/staff/moderation", label: "Moderation", icon: ShieldCheck },
    { href: "/staff/audit", label: "Audit", icon: ScrollText },
    { href: "/staff/config", label: "Config", icon: SlidersHorizontal },
    { href: "/staff/analytics", label: "Analytics", icon: BarChart3 },
  ],
};

/** Staff left-sidebar nav (desktop + mobile drawer). */
export const STAFF_SIDE_NAV: NavItem[] = [
  { href: "/staff", label: "Overview", icon: LayoutDashboard },
  { href: "/staff/moderation", label: "Moderation", icon: ShieldCheck },
  { href: "/staff/audit", label: "Audit Log", icon: ScrollText },
  { href: "/staff/config", label: "Config", icon: SlidersHorizontal },
  { href: "/staff/analytics", label: "Analytics", icon: BarChart3 },
];

export const roleToAppRole = (role: AppRole): AppRole => role;
