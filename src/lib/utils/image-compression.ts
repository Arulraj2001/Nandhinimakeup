export interface CompressedImageResult {
  file: File;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_ORIGINAL_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 0.82;

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
      error: `File "${file.name}" exceeds 15 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB). Originals must be 15 MB or smaller.`,
    };
  }

  return { valid: true };
}

export async function compressImageToWebP(
  file: File
): Promise<CompressedImageResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

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

  // Resize so the longest side is at most 2000 px (never upscale)
  if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * MAX_DIMENSION) / targetWidth);
      targetWidth = MAX_DIMENSION;
    } else {
      targetWidth = Math.round((targetWidth * MAX_DIMENSION) / targetHeight);
      targetHeight = MAX_DIMENSION;
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

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Failed to encode image to WebP format."));
      },
      "image/webp",
      WEBP_QUALITY
    );
  });

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
