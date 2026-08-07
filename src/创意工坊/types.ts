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
  like_count: number;
  download_count: number;
  preview_image_id?: string | null;
  preview_rating?: ImageRating | null;
  preview_url?: string | null;
  match_terms: string[];
  character_name: string;
  aliases: string[];
  created_at: number;
  updated_at: number;
  published_at?: number | null;
}

export interface PackImage {
  id: string;
  character_name: string;
  rating: ImageRating;
  aliases: string[];
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

export interface PackEngagement {
  like_count: number;
  download_count: number;
}

export interface InstalledPack {
  id: string;
  source?: 'remote' | 'offline';
  manifest: PackManifest;
  enabled: boolean;
  installedAt: number;
  updatedAt: number;
  localBytes: number;
  updateError: string;
  characterMigration?: {
    name: string;
    aliases: string[];
  };
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
  updateIntervalHours: number;
  lastUpdateCheck: number;
  packPreferences: Record<string, string>;
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

export interface WorkshopPlayerImage {
  id: string;
  rating: ImageRating;
  blob: Blob;
}

export interface WorkshopPlayerPack {
  id: string;
  name: string;
  author: string;
  images: WorkshopPlayerImage[];
}

export interface WorkshopPlayerData {
  subjectKey: string;
  title: string;
  kind: 'character' | 'category';
  initialRating: ImageRating;
  preferredPackId: string;
  routeDetectionFailed: boolean;
  packs: WorkshopPlayerPack[];
}

/** 兼容仍按旧版“图片数组”协议读取工坊结果的正文美化。 */
export interface LegacyWorkshopImage {
  id: string;
  rating: ImageRating;
  blob: Blob;
  characterName: string;
  packName: string;
  author: string;
}

export type WorkshopMatchResult = WorkshopPlayerData & LegacyWorkshopImage[];

export interface MatchRequest {
  text: string;
  chatId: string;
  messageId: string;
}

export interface WorkshopBridge {
  version: string;
  open: () => void;
  close: () => void;
  matchImages: (request: MatchRequest) => Promise<WorkshopMatchResult | null>;
  setPreferredPack: (subjectKey: string, packId: string) => Promise<void>;
  confirmDisplayed: (request: { chatId: string; messageId: string; imageId: string }) => Promise<void>;
  getSettings: () => Promise<WorkshopSettings>;
  setAutoInsert: (enabled: boolean) => Promise<void>;
  getInstalledSummary: () => Promise<{ installed: number; enabled: number }>;
}

export type WorldbookPackCategory = '角色' | '事件' | '扩展';

export interface DlcRelations {
  exclusions: string[];
  replacements: string[];
  prerequisites: string[];
}

export interface WorldbookPackSummary {
  id: string;
  owner_id: string;
  owner_name?: string;
  name: string;
  description: string;
  category: WorldbookPackCategory;
  dlc_key: string;
  relations: DlcRelations;
  status: 'draft' | 'published' | 'hidden' | 'removed';
  version: number;
  entry_count: number;
  byte_size: number;
  sha256: string;
  download_url: string;
  cover_url?: string | null;
  created_at: number;
  updated_at: number;
  published_at?: number | null;
}

export interface InstalledWorldbookPack {
  id: string;
  pack: WorldbookPackSummary;
  bookName: string;
  enabled: boolean;
  installedAt: number;
  updatedAt: number;
  updateError: string;
  missingPrerequisites: string[];
}

export interface WorldbookReplacementRecord {
  key: string;
  bookName: string;
  uid: number;
  entryName: string;
  originalEnabled: boolean;
  activePackIds: string[];
}
