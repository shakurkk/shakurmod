// File rules shared by uploads (admin) and display (public).
// The database enforces the same extension list and size cap.

export const MAX_FILE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
export const MAX_THUMB_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_EXTENSIONS = [
  "apk", "xapk", "apks", "obb", "zip", "rar", "7z", "tar", "gz",
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "json",
  "jpg", "jpeg", "png", "gif", "webp", "svg",
  "mp4", "mkv", "mov", "avi", "webm",
  "mp3", "wav", "ogg", "m4a",
  "exe", "msi", "dmg", "iso", "ipa", "deb",
] as const;

export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export const THUMB_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"] as const;

export type FileKind =
  | "apk"
  | "archive"
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "doc"
  | "program"
  | "other";

const KIND_MAP: Record<string, FileKind> = {
  apk: "apk", xapk: "apk", apks: "apk", obb: "apk", ipa: "apk",
  zip: "archive", rar: "archive", "7z": "archive", tar: "archive", gz: "archive",
  pdf: "pdf",
  jpg: "image", jpeg: "image", png: "image", gif: "image", webp: "image", svg: "image",
  mp4: "video", mkv: "video", mov: "video", avi: "video", webm: "video",
  mp3: "audio", wav: "audio", ogg: "audio", m4a: "audio",
  doc: "doc", docx: "doc", xls: "doc", xlsx: "doc", ppt: "doc", pptx: "doc", txt: "doc", csv: "doc", json: "doc",
  exe: "program", msi: "program", dmg: "program", iso: "program", deb: "program",
};

export function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx <= 0 || idx === filename.length - 1) return "";
  return filename.slice(idx + 1).toLowerCase();
}

export function isAllowedExtension(ext: string): ext is AllowedExtension {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

export type UploadCheck =
  | { ok: true; extension: AllowedExtension }
  | { ok: false; error: string };

export function validateUpload(file: { name: string; size: number }): UploadCheck {
  const ext = getExtension(file.name);
  if (!ext || !isAllowedExtension(ext)) {
    return { ok: false, error: `".${ext || "?"}" files are not allowed.` };
  }
  if (file.size <= 0) return { ok: false, error: "This file is empty." };
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: `File is larger than ${formatBytes(MAX_FILE_BYTES)}.` };
  }
  return { ok: true, extension: ext };
}

export function validateThumbnail(file: { name: string; size: number }): UploadCheck | { ok: false; error: string } {
  const ext = getExtension(file.name);
  if (!(THUMB_EXTENSIONS as readonly string[]).includes(ext)) {
    return { ok: false, error: "Thumbnail must be JPG, PNG, WEBP or GIF." };
  }
  if (file.size > MAX_THUMB_BYTES) {
    return { ok: false, error: `Thumbnail must be under ${formatBytes(MAX_THUMB_BYTES)}.` };
  }
  return { ok: true, extension: ext as AllowedExtension };
}

export function kindOf(ext: string): FileKind {
  return KIND_MAP[ext.toLowerCase()] ?? "other";
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const v = bytes / 1024 ** i;
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

export function safeStorageName(filename: string): string {
  return filename
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(-150);
}

export function plural(n: number, word: string): string {
  return `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;
}
