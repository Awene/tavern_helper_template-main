import { sha256Hex } from './image';
import type { InstalledImage, InstalledPack, PackManifest } from './types';

const MAGIC = new TextEncoder().encode('CWPACK01');
const HEADER_BYTES = MAGIC.length + 4;
const MAX_MANIFEST_BYTES = 1024 * 1024;
const MAX_IMAGES = 200;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_PACKAGE_BYTES = 1024 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface OfflineImageEntry {
  character_name: string;
  rating: 'sfw' | 'nsfw';
  aliases?: string[];
  mime_type: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number;
  height: number;
  byte_size: number;
  sha256: string;
}

interface OfflineManifest {
  format: 'cultivation-workshop-pack';
  version: 1;
  exported_at: number;
  pack: {
    name: string;
    description: string;
    category: '风景' | '人物' | '其他';
    owner_name: string;
    preview_image_index?: number;
  };
  images: OfflineImageEntry[];
}

function safeFileName(value: string): string {
  const printable = [...value].map(character => (character.charCodeAt(0) < 32 ? '_' : character)).join('');
  const name = printable
    .replace(/[<>:"/\\|?*]/gu, '_')
    .trim()
    .slice(0, 80);
  return name || '创意工坊图包';
}

function assertManifest(value: unknown): asserts value is OfflineManifest {
  if (!value || typeof value !== 'object') throw new Error('离线包清单无效');
  const manifest = value as Partial<OfflineManifest>;
  if (manifest.format !== 'cultivation-workshop-pack' || manifest.version !== 1) {
    throw new Error('不支持的离线包格式或版本');
  }
  if (
    !manifest.pack ||
    typeof manifest.pack.name !== 'string' ||
    !['风景', '人物', '其他'].includes(manifest.pack.category)
  ) {
    throw new Error('离线包的图包资料无效');
  }
  if (
    !manifest.pack.name.trim() ||
    manifest.pack.name.length > 60 ||
    typeof manifest.pack.description !== 'string' ||
    manifest.pack.description.length > 500 ||
    typeof manifest.pack.owner_name !== 'string' ||
    manifest.pack.owner_name.length > 100 ||
    !Number.isInteger(manifest.exported_at) ||
    manifest.exported_at < 1
  ) {
    throw new Error('离线包的图包文字资料无效');
  }
  if (!Array.isArray(manifest.images) || manifest.images.length < 1 || manifest.images.length > MAX_IMAGES) {
    throw new Error(`离线包应包含 1-${MAX_IMAGES} 张图片`);
  }
  if (
    manifest.pack.preview_image_index !== undefined &&
    (!Number.isInteger(manifest.pack.preview_image_index) ||
      manifest.pack.preview_image_index < 0 ||
      manifest.pack.preview_image_index >= manifest.images.length)
  ) {
    throw new Error('离线包的预览图索引无效');
  }
  for (const image of manifest.images) {
    if (!image || !ALLOWED_MIME_TYPES.has(image.mime_type)) throw new Error('离线包包含不支持的图片类型');
    if (!Number.isInteger(image.byte_size) || image.byte_size < 1 || image.byte_size > MAX_IMAGE_BYTES) {
      throw new Error('离线包包含大小异常的图片');
    }
    if (!/^[a-f0-9]{64}$/u.test(image.sha256)) throw new Error('离线包包含无效的图片哈希');
    const aliases = image.aliases ?? [];
    if (!Array.isArray(aliases) || aliases.some(alias => typeof alias !== 'string')) {
      throw new Error('离线包包含无效的角色别名');
    }
    if (
      aliases.length > 30 ||
      aliases.some(alias => !alias.trim() || alias.length > 30) ||
      typeof image.character_name !== 'string' ||
      image.character_name.length > 60 ||
      !Number.isInteger(image.width) ||
      !Number.isInteger(image.height) ||
      image.width < 1 ||
      image.height < 1 ||
      image.width > 20_000 ||
      image.height > 20_000
    ) {
      throw new Error('离线包包含越界的图片资料');
    }
    if (image.rating !== 'sfw' && image.rating !== 'nsfw') throw new Error('离线包包含无效的图片分级');
  }
}

export async function createOfflinePack(
  source: PackManifest,
  loadImage: (imageId: string) => Promise<Blob>,
): Promise<{ blob: Blob; filename: string }> {
  if (!source.images.length) throw new Error('空图包不能导出');
  if (source.images.length > MAX_IMAGES) throw new Error(`离线包最多包含 ${MAX_IMAGES} 张图片`);
  const blobs: Blob[] = [];
  const entries: OfflineImageEntry[] = [];
  for (const image of source.images) {
    const blob = await loadImage(image.id);
    if (!ALLOWED_MIME_TYPES.has(blob.type) || blob.size !== image.byte_size || blob.size > MAX_IMAGE_BYTES) {
      throw new Error(`图片「${image.character_name || image.id}」的数据与清单不一致`);
    }
    const digest = await sha256Hex(blob);
    if (digest !== image.sha256) throw new Error(`图片「${image.character_name || image.id}」哈希校验失败`);
    blobs.push(blob);
    entries.push({
      character_name: image.character_name,
      rating: image.rating,
      aliases: [...(image.aliases ?? [])],
      mime_type: image.mime_type,
      width: image.width,
      height: image.height,
      byte_size: image.byte_size,
      sha256: image.sha256,
    });
  }
  const manifest: OfflineManifest = {
    format: 'cultivation-workshop-pack',
    version: 1,
    exported_at: Math.floor(Date.now() / 1000),
    pack: {
      name: source.pack.name,
      description: source.pack.description,
      category: source.pack.category,
      owner_name: source.pack.owner_name ?? '',
      preview_image_index: Math.max(
        0,
        source.images.findIndex(image => image.id === source.pack.preview_image_id),
      ),
    },
    images: entries,
  };
  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
  if (manifestBytes.byteLength > MAX_MANIFEST_BYTES) throw new Error('离线包清单过大');
  const header = new Uint8Array(HEADER_BYTES);
  header.set(MAGIC);
  new DataView(header.buffer).setUint32(MAGIC.length, manifestBytes.byteLength, true);
  const blob = new Blob([header, manifestBytes, ...blobs], { type: 'application/vnd.cultivation-workshop-pack' });
  if (blob.size > MAX_PACKAGE_BYTES) throw new Error('离线包不能超过 1GB');
  return { blob, filename: `${safeFileName(source.pack.name)}.cwp` };
}

export async function readOfflinePack(file: File): Promise<{ pack: InstalledPack; images: InstalledImage[] }> {
  if (file.size < HEADER_BYTES || file.size > MAX_PACKAGE_BYTES) throw new Error('离线包大小无效或超过 1GB');
  const header = new Uint8Array(await file.slice(0, HEADER_BYTES).arrayBuffer());
  if (MAGIC.some((value, index) => header[index] !== value)) throw new Error('这不是有效的创意工坊离线包');
  const manifestLength = new DataView(header.buffer).getUint32(MAGIC.length, true);
  if (manifestLength < 2 || manifestLength > MAX_MANIFEST_BYTES || HEADER_BYTES + manifestLength > file.size) {
    throw new Error('离线包清单长度无效');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.slice(HEADER_BYTES, HEADER_BYTES + manifestLength).text());
  } catch {
    throw new Error('离线包清单不是有效 JSON');
  }
  assertManifest(parsed);
  const expectedSize = HEADER_BYTES + manifestLength + parsed.images.reduce((sum, image) => sum + image.byte_size, 0);
  if (expectedSize !== file.size) throw new Error('离线包尺寸与清单不一致');

  const packId = `offline_pack_${crypto.randomUUID().replaceAll('-', '')}`;
  const images: InstalledImage[] = [];
  const imageMetadata = [];
  let offset = HEADER_BYTES + manifestLength;
  for (const entry of parsed.images) {
    const blob = file.slice(offset, offset + entry.byte_size, entry.mime_type);
    offset += entry.byte_size;
    if ((await sha256Hex(blob)) !== entry.sha256) throw new Error('离线包图片哈希校验失败，文件可能已损坏');
    const imageId = `offline_image_${crypto.randomUUID().replaceAll('-', '')}`;
    images.push({ id: imageId, packId, sha256: entry.sha256, blob });
    imageMetadata.push({
      id: imageId,
      character_name: entry.character_name,
      rating: entry.rating,
      aliases: (entry.aliases ?? [])
        .map(alias => alias.trim())
        .filter(Boolean)
        .slice(0, 30),
      mime_type: entry.mime_type,
      width: entry.width,
      height: entry.height,
      byte_size: entry.byte_size,
      sha256: entry.sha256,
      status: 'active' as const,
      download_url: '',
      updated_at: parsed.exported_at,
    });
  }
  const now = Date.now();
  const previewImageId = imageMetadata[parsed.pack.preview_image_index ?? 0]?.id ?? imageMetadata[0]?.id ?? null;
  return {
    images,
    pack: {
      id: packId,
      source: 'offline',
      manifest: {
        pack: {
          id: packId,
          owner_id: 'offline',
          owner_name: parsed.pack.owner_name || '离线包作者',
          name: parsed.pack.name.slice(0, 60),
          description: parsed.pack.description.slice(0, 500),
          category: parsed.pack.category,
          status: 'published',
          version: 1,
          image_count: imageMetadata.length,
          like_count: 0,
          download_count: 0,
          preview_image_id: previewImageId,
          preview_url: null,
          created_at: parsed.exported_at,
          updated_at: parsed.exported_at,
          published_at: parsed.exported_at,
        },
        images: imageMetadata,
      },
      enabled: true,
      installedAt: now,
      updatedAt: now,
      localBytes: images.reduce((sum, image) => sum + image.blob.size, 0),
      updateError: '',
    },
  };
}
