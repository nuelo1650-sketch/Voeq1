/**
 * Repository interfaces — the migration contract (Doc 07 §7.7 / §7.8).
 *
 * These are SHAPES ONLY. The real backend (Phase 9) fulfills these signatures;
 * the UI imports the interface, never the implementation. Slice 0 provides a trivial
 * mock (mock.ts) so the boundary exists before any backend. B.16-shaped fixtures
 * (15 listings, ≥5 imperfect photos) are a Slice 4 concern and are intentionally
 * NOT present here.
 */

export interface Vendor {
  id: string;
  name: string;
  handle: string;
  campus: string;
  categoryIds: string[];
}

export interface Listing {
  id: string;
  vendorId: string;
  title: string;
  priceMinor: number;
  isPublished: boolean;
  images: string[];
}

export interface ActivityEvent {
  id: string;
  type: string;
  campusZone: string;
  refId: string;
  ts: string;
}

export interface Review {
  id: string;
  vendorId: string;
  authorId: string;
  rating: number;
  body: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessageAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  state: "pending" | "sent" | "delivered" | "failed";
  createdAt: string;
}

export interface StaffCase {
  id: string;
  queue: string;
  decision: string | null;
  consequence: string | null;
}

export interface ListingsRepo {
  list(params?: { campus?: string; category?: string }): Promise<Listing[]>;
  getById(id: string): Promise<Listing | null>;
}

export interface VendorsRepo {
  listVendors(params?: { campus?: string }): Promise<Vendor[]>;
  getById(id: string): Promise<Vendor | null>;
}

export interface ActivityRepo {
  recent(campusZone: string, limit?: number): Promise<ActivityEvent[]>;
}

export interface AuthRepo {
  currentIdentity(): Promise<{ id: string; capabilities: string[] } | null>;
}

export interface MessagesRepo {
  listConversations(identityId: string): Promise<Conversation[]>;
}

export interface StaffRepo {
  listCases(queue: string): Promise<StaffCase[]>;
}

export interface SearchRepo {
  search(query: string): Promise<Listing[]>;
}
