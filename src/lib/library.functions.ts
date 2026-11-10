import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public, read-only library endpoints. The files/folders tables and the thumbnails
// bucket are admin-only in the database, so visitors read through these narrow
// handlers, which return only public columns (never storage paths).
const PUBLIC_FILE_COLUMNS =
  "id, name, description, folder_id, category_id, extension, mime_type, size_bytes, download_count, created_at, updated_at, thumbnail_path, category:categories(id,name,slug,color)";

type RawFile = {
  id: string;
  name: string;
  description: string | null;
  folder_id: string | null;
  category_id: string | null;
  extension: string;
  mime_type: string;
  size_bytes: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  thumbnail_path: string | null;
  category: { id: string; name: string; slug: string; color: string } | null;
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function toPublic(rows: RawFile[]) {
  const sb = await admin();
  const paths = rows.map((r) => r.thumbnail_path).filter((p): p is string => !!p);
  const map = new Map<string, string>();
  if (paths.length) {
    const { data } = await sb.storage.from("thumbnails").createSignedUrls(paths, 60 * 60);
    data?.forEach((d) => {
      if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
    });
  }
  return rows.map(({ thumbnail_path, ...r }) => ({
    ...r,
    thumbUrl: thumbnail_path ? (map.get(thumbnail_path) ?? null) : null,
  }));
}

function sanitizeSearch(q: string) {
  return q.replace(/[,()%*\\.]/g, " ").trim().slice(0, 80);
}

const filterSchema = z.object({
  folderId: z.string().uuid().nullable().optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  order: z.enum(["recent", "popular", "name"]).optional(),
  limit: z.number().int().min(1).max(1000).optional(),
});

export const listPublicFiles = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => filterSchema.parse(input ?? {}))
  .handler(async ({ data: f }) => {
    const sb = await admin();
    let q = sb.from("files").select(PUBLIC_FILE_COLUMNS);
    if (f.folderId === null) q = q.is("folder_id", null);
    else if (f.folderId) q = q.eq("folder_id", f.folderId);
    if (f.categoryId) q = q.eq("category_id", f.categoryId);
    if (f.search) {
      const s = sanitizeSearch(f.search);
      if (s) q = q.or(`name.ilike.%${s}%,description.ilike.%${s}%`);
    }
    if (f.order === "popular") q = q.order("download_count", { ascending: false });
    else if (f.order === "name") q = q.order("name", { ascending: true });
    else q = q.order("created_at", { ascending: false });
    const { data, error } = await q.limit(f.limit ?? 500);
    if (error) throw new Error("Could not load files");
    return toPublic((data ?? []) as unknown as RawFile[]);
  });

export const getPublicFile = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    if (!z.string().uuid().safeParse(data.id).success) return null;
    const sb = await admin();
    const { data: row, error } = await sb.from("files").select(PUBLIC_FILE_COLUMNS).eq("id", data.id).maybeSingle();
    if (error) throw new Error("Could not load file");
    if (!row) return null;
    const [item] = await toPublic([row as unknown as RawFile]);
    return item ?? null;
  });

export const listPublicFolders = createServerFn({ method: "POST" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("folders")
    .select("id, name, description, parent_id, created_at, updated_at")
    .order("name");
  if (error) throw new Error("Could not load folders");
  return data ?? [];
});

export const listPublicCategories = createServerFn({ method: "POST" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb.from("categories").select("id, name, slug, color, created_at").order("name");
  if (error) throw new Error("Could not load categories");
  return data ?? [];
});

export const getLibraryStats = createServerFn({ method: "POST" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb.from("files").select("size_bytes, download_count, category_id, folder_id");
  if (error) throw new Error("Could not load stats");
  const rows = data ?? [];
  return {
    count: rows.length,
    bytes: rows.reduce((a, r) => a + Number(r.size_bytes), 0),
    downloads: rows.reduce((a, r) => a + Number(r.download_count), 0),
    byCategory: rows.reduce<Record<string, number>>((acc, r) => {
      if (r.category_id) acc[r.category_id] = (acc[r.category_id] ?? 0) + 1;
      return acc;
    }, {}),
    byFolder: rows.reduce<Record<string, number>>((acc, r) => {
      if (r.folder_id) acc[r.folder_id] = (acc[r.folder_id] ?? 0) + 1;
      return acc;
    }, {}),
  };
});
