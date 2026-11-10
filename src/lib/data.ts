import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;
export type Folder = Tables<"folders">;
export type FileRow = Tables<"files">;
export type FileItem = FileRow & {
  thumbUrl: string | null;
  category: Pick<Category, "id" | "name" | "slug" | "color"> | null;
};

const FILE_SELECT = "*, category:categories(id,name,slug,color)";

async function attachThumbs(rows: (FileRow & { category: FileItem["category"] })[]): Promise<FileItem[]> {
  const paths = rows.map((r) => r.thumbnail_path).filter((p): p is string => !!p);
  const map = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from("thumbnails").createSignedUrls(paths, 60 * 60);
    data?.forEach((d) => {
      if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
    });
  }
  return rows.map((r) => ({ ...r, thumbUrl: r.thumbnail_path ? (map.get(r.thumbnail_path) ?? null) : null }));
}

function sanitizeSearch(q: string) {
  return q.replace(/[,()%*\\]/g, " ").trim().slice(0, 80);
}

export type FileFilter = {
  folderId?: string | null | undefined; // null = root only, undefined = any
  categoryId?: string | undefined;
  search?: string | undefined;
  order?: "recent" | "popular" | "name";
  limit?: number;
};

export const filesQuery = (f: FileFilter = {}) =>
  queryOptions({
    queryKey: ["files", f],
    queryFn: async () => {
      let q = supabase.from("files").select(FILE_SELECT);
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
      q = q.limit(f.limit ?? 500);
      const { data, error } = await q;
      if (error) throw error;
      return attachThumbs((data ?? []) as never);
    },
  });

export const fileQuery = (id: string) =>
  queryOptions({
    queryKey: ["file", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("files").select(FILE_SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [item] = await attachThumbs([data as never]);
      return item;
    },
  });

export const foldersQuery = () =>
  queryOptions({
    queryKey: ["folders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("folders").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

export const libraryStatsQuery = () =>
  queryOptions({
    queryKey: ["library-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("files")
        .select("size_bytes, download_count, category_id, folder_id");
      if (error) throw error;
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
    },
  });

export function folderPath(folders: Folder[], id: string | null | undefined): Folder[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const path: Folder[] = [];
  let cur = id ? byId.get(id) : undefined;
  let guard = 0;
  while (cur && guard++ < 50) {
    path.unshift(cur);
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
  }
  return path;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
