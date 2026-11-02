export interface CompressedImageResult {
  file: File;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

export type CompressionPreset = "blog_featured" | "standard" | "high_res";

export interface CompressionPresetConfig {
  name: string;
  badge: string;
  description: string;
  maxDimension: number;
  quality: number;
  targetMaxBytes: number;
}

export const COMPRESSION_PRESETS: Record<CompressionPreset, CompressionPresetConfig> = {
  blog_featured: {
    name: "Blog Featured Banner",
    badge: "1200px • ~70-100 KB (Recommended)",
    description:
      "Optimized for ChatGPT AI banners, OpenGraph sharing cards & Core Web Vitals.",
    maxDimension: 1200,
    quality: 0.8,
    targetMaxBytes: 120 * 1024,
  },
  standard: {
    name: "Standard Web",
    badge: "1400px • ~120-150 KB",
    description: "General website banners, service cards, and studio imagery.",
    maxDimension: 1400,
    quality: 0.8,
    targetMaxBytes: 180 * 1024,
  },
  high_res: {
    name: "High-Res Showcase",
    badge: "1800px • ~250-350 KB",
    description:
      "Maximum detail for bridal jewellery zoom and fine bridal portfolio portraits.",
    maxDimension: 1800,
    quality: 0.84,
    targetMaxBytes: 350 * 1024,
  },
};

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_ORIGINAL_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB max input allowance

export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file format for "${file.name}". Only JPEG, PNG, and WebP images are allowed.`,
    };
  }

  if (file.size > MAX_ORIGINAL_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds 20 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB). Originals must be 20 MB or smaller.`,
    };
  }

  return { valid: true };
}

export async function compressImageToWebP(
  file: File,
  preset: CompressionPreset = "blog_featured"
): Promise<CompressedImageResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const config = COMPRESSION_PRESETS[preset] || COMPRESSION_PRESETS.blog_featured;

  // createImageBitmap with imageOrientation from-image automatically respects EXIF rotation
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
  } catch {
    // Fallback if orientation options are unsupported in older environment
    bitmap = await createImageBitmap(file);
  }

  let targetWidth = bitmap.width;
  let targetHeight = bitmap.height;

  // Resize so the longest side is at most config.maxDimension (never upscale)
  if (targetWidth > config.maxDimension || targetHeight > config.maxDimension) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * config.maxDimension) / targetWidth);
      targetWidth = config.maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * config.maxDimension) / targetHeight);
      targetHeight = config.maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(
      "Unable to create canvas 2D rendering context for image compression."
    );
  }

  // Draw white background in case source PNG has transparency to avoid black artifacts in WebP
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const encodeToWebP = (quality: number): Promise<Blob> => {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("Failed to encode image to WebP format."));
        },
        "image/webp",
        quality
      );
    });
  };

  // First pass encoding with preset quality
  let blob = await encodeToWebP(config.quality);

  // Adaptive second pass: If output exceeds target cap, drop quality slightly to guarantee <120KB
  if (blob.size > config.targetMaxBytes && config.quality > 0.7) {
    const secondPassQuality = Math.max(0.7, config.quality - 0.08);
    const smallerBlob = await encodeToWebP(secondPassQuality);
    if (smallerBlob.size < blob.size) {
      blob = smallerBlob;
    }
  }

  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const compressedFileName = `${baseName}.webp`;
  const compressedFile = new File([blob], compressedFileName, {
    type: "image/webp",
    lastModified: Date.now(),
  });

  return {
    file: compressedFile,
    width: targetWidth,
    height: targetHeight,
    originalSize: file.size,
    compressedSize: blob.size,
  };
}
