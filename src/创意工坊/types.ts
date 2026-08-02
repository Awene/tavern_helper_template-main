export type PackCategory = '风景' | '人物' | '其他';
export type ImageRating = 'sfw' | 'nsfw';

export interface WorkshopUser {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  status: 'active' | 'banned';
  isAdmin: boolean;
}

export interface PackSummary {
  id: string;
  owner_id: string;
  owner_name?: string;
  name: string;
  description: string;
  category: PackCategory;
  status: 'draft' | 'published' | 'hidden' | 'removed';
  version: number;
  image_count?: number;
  created_at: number;
  updated_at: number;
  published_at?: number | null;
}

export interface PackImage {
  id: string;
  character_name: string;
  rating: ImageRating;
  keywords: string[];
  mime_type: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number;
  height: number;
  byte_size: number;
  sha256: string;
  status: 'active' | 'hidden' | 'removed';
  download_url: string;
  updated_at: number;
}

export interface PackManifest {
  pack: PackSummary;
  images: PackImage[];
}

export interface InstalledPack {
  id: string;
  manifest: PackManifest;
  enabled: boolean;
  installedAt: number;
  updatedAt: number;
  localBytes: number;
  updateError: string;
}

export interface InstalledImage {
  id: string;
  packId: string;
  sha256: string;
  blob: Blob;
}

export interface WorkshopSettings {
  key: 'main';
  apiBase: string;
  autoInsert: boolean;
  maxPerMessage: number;
  updateIntervalHours: number;
  lastUpdateCheck: number;
}

export interface AuthRecord {
  key: 'session';
  token: string;
  expiresAt: number;
  user: WorkshopUser;
}

export interface SelectionRecord {
  key: string;
  chatId: string;
  messageId: string;
  contentHash: string;
  imageIds: string[];
  createdAt: number;
}

export interface HistoryRecord {
  key: string;
  chatId: string;
  imageId: string;
  count: number;
}

export interface DisplayRecord {
  key: string;
  chatId: string;
  messageId: string;
  imageId: string;
  createdAt: number;
}

export interface MatchedWorkshopImage {
  id: string;
  packId: string;
  packName: string;
  author: string;
  characterName: string;
  rating: ImageRating;
  keywords: string[];
  blob: Blob;
  score: number;
}

export interface MatchRequest {
  text: string;
  chatId: string;
  messageId: string;
}

export interface WorkshopBridge {
  version: string;
  open: () => void;
  close: () => void;
  matchImages: (request: MatchRequest) => Promise<MatchedWorkshopImage[]>;
  confirmDisplayed: (request: { chatId: string; messageId: string; imageId: string }) => Promise<void>;
  getSettings: () => Promise<WorkshopSettings>;
  setAutoInsert: (enabled: boolean) => Promise<void>;
  getInstalledSummary: () => Promise<{ installed: number; enabled: number }>;
}
