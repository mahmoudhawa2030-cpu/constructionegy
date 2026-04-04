"use client";

import imageCompression from "browser-image-compression";

/** Longest edge after resize (keeps aspect ratio). */
export const COMPRESS_MAX_DIMENSION = 2048;

/** Target output budget; library iterates quality downward as needed. */
export const COMPRESS_MAX_SIZE_MB = 1.25;

function stripExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

/**
 * Resize + re-encode images before Storage upload. Skips GIF (keeps animation).
 * On failure or if output would be larger, returns the original file.
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (file.type === "image/gif") {
    return file;
  }
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const options: Parameters<typeof imageCompression>[1] = {
    maxSizeMB: COMPRESS_MAX_SIZE_MB,
    maxWidthOrHeight: COMPRESS_MAX_DIMENSION,
    useWebWorker: typeof Worker !== "undefined",
    initialQuality: 0.82,
    fileType: file.type,
  };

  try {
    const compressed = await imageCompression(file, options);

    if (compressed.size >= file.size * 0.98) {
      return file;
    }

    const type = compressed.type || file.type;
    const ext = extensionForMime(type);
    const base = stripExtension(file.name).slice(0, 80) || "image";
    return new File([compressed], `${base}.${ext}`, {
      type,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
