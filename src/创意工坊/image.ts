const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_EDGE = 1600;
const MAX_BYTES = 6 * 1024 * 1024;

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('图片重新编码失败'))), type, quality);
  });
}

export async function prepareUploadImage(
  file: File,
): Promise<{ blob: Blob; filename: string; width: number; height: number }> {
  if (!ALLOWED_TYPES.has(file.type) || /\.(gif|svg)$/iu.test(file.name)) {
    throw new Error('只支持 JPEG、PNG、WebP，不支持 GIF 或 SVG');
  }
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('浏览器无法创建图片画布');
    context.drawImage(bitmap, 0, 0, width, height);
    let outputType = file.type;
    let blob = await canvasBlob(canvas, outputType, outputType === 'image/png' ? undefined : 0.9);
    if (blob.size > MAX_BYTES) {
      outputType = 'image/webp';
      for (const quality of [0.85, 0.75, 0.65, 0.55]) {
        blob = await canvasBlob(canvas, outputType, quality);
        if (blob.size <= MAX_BYTES) break;
      }
    }
    if (blob.size > MAX_BYTES) throw new Error('重新编码后图片仍超过 6MB，请降低分辨率后重试');
    const extension = outputType === 'image/jpeg' ? 'jpg' : outputType === 'image/png' ? 'png' : 'webp';
    const baseName = file.name.replace(/\.[^.]+$/u, '').slice(0, 80) || 'image';
    return { blob, filename: `${baseName}.${extension}`, width, height };
  } finally {
    bitmap.close();
  }
}

export async function sha256Hex(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}
