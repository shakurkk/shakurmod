import { supabase } from "@/integrations/supabase/client";
import { getExtension, safeStorageName, validateThumbnail, validateUpload } from "@/lib/file-types";

const SMALL_FILE = 6 * 1024 * 1024;

async function uploadLarge(file: File, objectName: string, onProgress: (pct: number) => void) {
  const tus = await import("tus-js-client");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session expired. Sign in again.");
  const base = import.meta.env["VITE_SUPABASE_URL"] as string;
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${base}/storage/v1/upload/resumable`,
      retryDelays: [0, 2000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${token}`, apikey: key, "x-upsert": "false" },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: "files",
        objectName,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024,
      onError: (err) => reject(err),
      onProgress: (sent, total) => onProgress(total ? (sent / total) * 100 : 0),
      onSuccess: () => resolve(),
    });
    upload.findPreviousUploads().then((prev) => {
      const last = prev[0];
      if (last) upload.resumeFromPreviousUpload(last);
      upload.start();
    });
  });
}

export async function uploadToFiles(file: File, objectName: string, onProgress: (pct: number) => void) {
  if (file.size <= SMALL_FILE) {
    onProgress(5);
    const { error } = await supabase.storage.from("files").upload(objectName, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) throw error;
    onProgress(100);
    return;
  }
  await uploadLarge(file, objectName, onProgress);
}

export async function uploadThumbnail(fileId: string, thumb: File) {
  const check = validateThumbnail(thumb);
  if (!check.ok) throw new Error(check.error);
  const path = `${fileId}/${Date.now()}.${getExtension(thumb.name)}`;
  const { error } = await supabase.storage.from("thumbnails").upload(path, thumb, {
    contentType: thumb.type || "image/png",
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export type NewFileMeta = {
  name: string;
  description: string | null;
  folderId: string | null;
  categoryId: string | null;
  thumbnail: File | null;
};

export async function createFile(file: File, meta: NewFileMeta, onProgress: (pct: number) => void) {
  const check = validateUpload(file);
  if (!check.ok) throw new Error(check.error);

  const id = crypto.randomUUID();
  const storagePath = `${id}/${safeStorageName(file.name)}`;
  await uploadToFiles(file, storagePath, onProgress);

  let thumbPath: string | null = null;
  try {
    const thumbSource =
      meta.thumbnail ?? (validateThumbnail(file).ok ? file : null); // images double as their own thumbnail
    if (thumbSource) thumbPath = await uploadThumbnail(id, thumbSource);
  } catch {
    thumbPath = null;
  }

  const { error } = await supabase.from("files").insert({
    id,
    name: meta.name.trim() || file.name,
    description: meta.description?.trim() || null,
    folder_id: meta.folderId,
    category_id: meta.categoryId,
    storage_path: storagePath,
    thumbnail_path: thumbPath,
    extension: check.extension,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
  });
  if (error) {
    await supabase.storage.from("files").remove([storagePath]);
    if (thumbPath) await supabase.storage.from("thumbnails").remove([thumbPath]);
    throw error;
  }
  return id;
}

export async function deleteFile(f: { id: string; storage_path: string; thumbnail_path: string | null }) {
  const { error } = await supabase.from("files").delete().eq("id", f.id);
  if (error) throw error;
  await supabase.storage.from("files").remove([f.storage_path]);
  if (f.thumbnail_path) await supabase.storage.from("thumbnails").remove([f.thumbnail_path]);
}
