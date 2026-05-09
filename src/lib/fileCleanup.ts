import { join } from "path";
import { deleteFile as storageDeleteFile } from "./storage";

/**
 * Delete local file from public directory
 * Skip remote URLs (http/https)
 */
export async function deleteLocalFile(url: string | null | undefined): Promise<void> {
  if (!url || url.startsWith("http://") || url.startsWith("https://")) {
    return; // Skip remote URLs
  }

  let filePath = url.startsWith("/") ? url.substring(1) : url;
  const fullPath = join(process.cwd(), "public", filePath);

  try {
    const fs = await import("fs/promises");
    await fs.unlink(fullPath);
    console.log(`[Cleanup] Deleted local file: ${fullPath}`);
  } catch (err: any) {
    if (err.code !== "ENOENT") {
      console.error(`[Cleanup] Failed to delete file ${fullPath}:`, err.message);
    }
  }
}

/**
 * Delete file from storage (supports all providers: local, R2, Cloudinary, Supabase)
 * Automatically determines if it's a local path or cloud path
 */
export async function deleteStorageFile(url: string | null | undefined): Promise<void> {
  if (!url) return;

  // Skip remote URLs (external URLs, not our storage)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    // Check if it's our own cloud storage URL
    // R2: ends with .r2.cloudflarestorage.com or starts with R2_PUBLIC_URL
    // Cloudinary: contains res.cloudinary.com
    // Supabase: contains supabase.co/storage
    const isCloudStorage =
      url.includes(".r2.cloudflarestorage.com") ||
      url.includes("res.cloudinary.com") ||
      url.includes("supabase.co/storage");

    if (!isCloudStorage) {
      // External URL, skip
      return;
    }
    // It's our cloud storage URL, extract path and delete
  }

  // Extract path from URL
  let path = url;

  // Remove leading slash
  if (path.startsWith("/")) {
    path = path.substring(1);
  }

  // For cloud storage, the path is the full key (not relative to public)
  // For local storage, it's relative to public folder

  try {
    await storageDeleteFile(path);
    console.log(`[Cleanup] Deleted storage file: ${path}`);
  } catch (err: any) {
    console.error(`[Cleanup] Failed to delete storage file ${path}:`, err.message);
  }
}

/**
 * Compare old and new file URLs, delete old if changed
 * Uses storage abstraction to support all providers
 */
export async function cleanupFileChange(
  oldUrl: string | null | undefined,
  newUrl: string | null | undefined
): Promise<void> {
  if (oldUrl && oldUrl !== newUrl) {
    await deleteStorageFile(oldUrl);
  }
}

/**
 * Delete file if explicitly set to null/empty (user removed it)
 */
export async function cleanupFileRemoval(
  oldUrl: string | null | undefined,
  newUrl: string | null | undefined
): Promise<void> {
  // If old file exists and new is empty/null, delete old
  if (oldUrl && (!newUrl || newUrl === "")) {
    await deleteStorageFile(oldUrl);
  }
  // If old file exists and different from new, delete old
  if (oldUrl && newUrl && oldUrl !== newUrl) {
    await deleteStorageFile(oldUrl);
  }
}