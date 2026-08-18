import type {
  ActivityRepo,
  AuthRepo,
  ListingsRepo,
  MessagesRepo,
  SearchRepo,
  StaffRepo,
  VendorsRepo,
} from "./interfaces";

/**
 * Trivial in-memory mock. Returns shape-correct EMPTY data — no hardcoded vendors,
 * no fake listings, no B.16 fixture (Slice 4). This exists only to make the
 * mock→real boundary real and importable. Real impl swaps in at Phase 9 with no UI change.
 */
export const mockListingsRepo: ListingsRepo = {
  async list() {
    return [];
  },
  async getById() {
    return null;
  },
};

export const mockVendorsRepo: VendorsRepo = {
  async listVendors() {
    return [];
  },
  async getById() {
    return null;
  },
};

export const mockActivityRepo: ActivityRepo = {
  async recent() {
    return [];
  },
};

export const mockAuthRepo: AuthRepo = {
  async currentIdentity() {
    return null;
  },
};

export const mockMessagesRepo: MessagesRepo = {
  async listConversations() {
    return [];
  },
};

export const mockStaffRepo: StaffRepo = {
  async listCases() {
    return [];
  },
};

export const mockSearchRepo: SearchRepo = {
  async search() {
    return [];
  },
};

export const mockRepos = {
  listings: mockListingsRepo,
  vendors: mockVendorsRepo,
  activity: mockActivityRepo,
  auth: mockAuthRepo,
  messages: mockMessagesRepo,
  staff: mockStaffRepo,
  search: mockSearchRepo,
};
