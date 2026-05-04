/**
 * Storage Provider Abstraction
 * Supports: local, cloudflare-r2, cloudinary, supabase
 *
 * Usage:
 *   import { uploadFile, deleteFile, getPublicUrl } from "@/lib/storage"
 *
 *   // Upload
 *   const result = await uploadFile(file, "uploads/")
 *
 *   // Get URL
 *   const url = getPublicUrl(result.path)
 *
 *   // Delete
 *   await deleteFile(result.path)
 */

import { writeFile, unlink } from "fs/promises";
import { join } from "path";

// ============================================
// CONFIGURATION
// ============================================

export type StorageProvider = "local" | "cloudflare-r2" | "cloudinary" | "supabase";

interface StorageConfig {
  provider: StorageProvider;
  // Local
  localPath?: string;
  localBaseUrl?: string;
  // Cloudflare R2
  r2AccountId?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2Bucket?: string;
  r2PublicUrl?: string;
  // Cloudinary
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  cloudinaryFolder?: string;
  // Supabase
  supabaseUrl?: string;
  supabaseKey?: string;
  supabaseBucket?: string;
}

// Get config from environment
function getConfig(): StorageConfig {
  // For local storage, use public/uploads for Next.js static serving
  const localStorageBase = process.env.NODE_ENV === "production"
    ? "./public/uploads"
    : "./public/uploads";

  return {
    provider: (process.env.STORAGE_PROVIDER as StorageProvider) || "local",
    // Local
    localPath: process.env.LOCAL_STORAGE_PATH || localStorageBase,
    localBaseUrl: process.env.LOCAL_STORAGE_BASE_URL || "/uploads",
    // Cloudflare R2
    r2AccountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID,
    r2AccessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    r2Bucket: process.env.CLOUDFLARE_R2_BUCKET,
    r2PublicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL,
    // Cloudinary
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    cloudinaryFolder: process.env.CLOUDINARY_FOLDER || "toefllynk",
    // Supabase
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseBucket: process.env.SUPABASE_BUCKET || "toefllynk",
  };
}

// ============================================
// RESULT TYPE
// ============================================

export interface UploadResult {
  success: boolean;
  path: string;
  url: string;
  provider: StorageProvider;
  metadata?: {
    originalName: string;
    mimeType: string;
    size: number;
  };
}

// ============================================
// LOCAL STORAGE
// ============================================

async function uploadLocal(
  file: File | Buffer,
  folder: string,
  metadata?: { originalName?: string }
): Promise<UploadResult> {
  const config = getConfig();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  let fileBuffer: Buffer;
  let extension = "";

  if (file instanceof File) {
    extension = file.name.split(".").pop() || "";
    const arrayBuffer = await file.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } else {
    fileBuffer = file;
  }

  const filename = `${timestamp}-${random}${extension ? "." + extension : ""}`;
  const relativePath = `${folder}${filename}`;
  const fullPath = join(config.localPath!, relativePath);

  // Ensure directory exists
  const fs = await import("fs/promises");
  await fs.mkdir(join(config.localPath!, folder), { recursive: true });

  await writeFile(fullPath, fileBuffer);

  return {
    success: true,
    path: relativePath,
    url: `${config.localBaseUrl}/${relativePath}`,
    provider: "local",
    metadata: {
      originalName: metadata?.originalName || filename,
      mimeType: file instanceof File ? file.type : "application/octet-stream",
      size: fileBuffer.length,
    },
  };
}

async function deleteLocal(path: string): Promise<boolean> {
  const config = getConfig();
  try {
    const fullPath = join(config.localPath!, path);
    await unlink(fullPath);
    return true;
  } catch {
    return false;
  }
}

function getLocalUrl(path: string): string {
  const config = getConfig();
  return `${config.localBaseUrl}/${path}`;
}

// ============================================
// CLOUDFLARE R2
// ============================================

async function uploadR2(
  file: File | Buffer,
  folder: string,
  metadata?: { originalName?: string }
): Promise<UploadResult> {
  const config = getConfig();

  // Dynamic import S3 client
  const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2AccessKeyId!,
      secretAccessKey: config.r2SecretAccessKey!,
    },
  });

  let fileBuffer: Buffer;
  let mimeType = "application/octet-stream";
  let originalName = "file";

  if (file instanceof File) {
    originalName = file.name;
    mimeType = file.type;
    const arrayBuffer = await file.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } else {
    fileBuffer = file;
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop() || "";
  const filename = `${timestamp}-${random}${extension ? "." + extension : ""}`;
  const key = `${folder}${filename}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: config.r2Bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    })
  );

  return {
    success: true,
    path: key,
    url: `${config.r2PublicUrl}/${key}`,
    provider: "cloudflare-r2",
    metadata: {
      originalName,
      mimeType,
      size: fileBuffer.length,
    },
  };
}

async function deleteR2(path: string): Promise<boolean> {
  const config = getConfig();
  const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2AccessKeyId!,
      secretAccessKey: config.r2SecretAccessKey!,
    },
  });

  await s3.send(
    new DeleteObjectCommand({
      Bucket: config.r2Bucket,
      Key: path,
    })
  );

  return true;
}

function getR2Url(path: string): string {
  const config = getConfig();
  return `${config.r2PublicUrl}/${path}`;
}

// ============================================
// CLOUDINARY
// ============================================

async function uploadCloudinary(
  file: File | Buffer,
  folder: string,
  metadata?: { originalName?: string }
): Promise<UploadResult> {
  const config = getConfig();

  const cloudinary = await import("cloudinary");

  const v2 = cloudinary.v2;
  v2.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
  });

  let fileBuffer: Buffer;
  let originalName = "file";

  if (file instanceof File) {
    originalName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } else {
    fileBuffer = file;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = v2.uploader.upload_stream(
      {
        folder: `${config.cloudinaryFolder}/${folder}`,
        resource_type: "auto",
        public_id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload failed"));
          return;
        }

        resolve({
          success: true,
          path: result.public_id,
          url: result.secure_url,
          provider: "cloudinary",
          metadata: {
            originalName,
            mimeType: result.resource_type === "image" ? `image/${result.format}` : result.resource_type,
            size: result.bytes,
          },
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

async function deleteCloudinary(path: string): Promise<boolean> {
  const config = getConfig();

  const cloudinary = await import("cloudinary");

  const v2 = cloudinary.v2;
  v2.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
  });

  await v2.uploader.destroy(path);
  return true;
}

function getCloudinaryUrl(path: string): string {
  const config = getConfig();
  return `https://res.cloudinary.com/${config.cloudinaryCloudName}/image/upload/${path}`;
}

// ============================================
// SUPABASE STORAGE
// ============================================

async function uploadSupabase(
  file: File | Buffer,
  folder: string,
  metadata?: { originalName?: string }
): Promise<UploadResult> {
  const config = getConfig();

  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(config.supabaseUrl!, config.supabaseKey!);

  let fileBuffer: Buffer;
  let originalName = "file";
  let mimeType = "application/octet-stream";

  if (file instanceof File) {
    originalName = file.name;
    mimeType = file.type;
    const arrayBuffer = await file.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } else {
    fileBuffer = file;
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop() || "";
  const filename = `${timestamp}-${random}${extension ? "." + extension : ""}`;
  const path = `${folder}${filename}`;

  const { data, error } = await supabase.storage
    .from(config.supabaseBucket!)
    .upload(path, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(config.supabaseBucket!)
    .getPublicUrl(data.path);

  return {
    success: true,
    path: data.path,
    url: urlData.publicUrl,
    provider: "supabase",
    metadata: {
      originalName,
      mimeType,
      size: fileBuffer.length,
    },
  };
}

async function deleteSupabase(path: string): Promise<boolean> {
  const config = getConfig();

  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(config.supabaseUrl!, config.supabaseKey!);

  const { error } = await supabase.storage
    .from(config.supabaseBucket!)
    .remove([path]);

  return !error;
}

function getSupabaseUrl(path: string): string {
  const config = getConfig();
  return `${config.supabaseUrl}/storage/v1/object/public/${config.supabaseBucket}/${path}`;
}

// ============================================
// MAIN EXPORTS
// ============================================

export async function uploadFile(
  file: File | Buffer,
  folder: string = "general/",
  metadata?: { originalName?: string }
): Promise<UploadResult> {
  const config = getConfig();

  switch (config.provider) {
    case "cloudflare-r2":
      return uploadR2(file, folder, metadata);
    case "cloudinary":
      return uploadCloudinary(file, folder, metadata);
    case "supabase":
      return uploadSupabase(file, folder, metadata);
    case "local":
    default:
      return uploadLocal(file, folder, metadata);
  }
}

export async function deleteFile(path: string): Promise<boolean> {
  const config = getConfig();

  switch (config.provider) {
    case "cloudflare-r2":
      return deleteR2(path);
    case "cloudinary":
      return deleteCloudinary(path);
    case "supabase":
      return deleteSupabase(path);
    case "local":
    default:
      return deleteLocal(path);
  }
}

export function getPublicUrl(path: string): string {
  const config = getConfig();

  switch (config.provider) {
    case "cloudflare-r2":
      return getR2Url(path);
    case "cloudinary":
      return getCloudinaryUrl(path);
    case "supabase":
      return getSupabaseUrl(path);
    case "local":
    default:
      return getLocalUrl(path);
  }
}

export function getProvider(): StorageProvider {
  return getConfig().provider;
}
