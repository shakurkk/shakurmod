import { queryOptions } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { getLibraryStats, listPublicCategories, getPublicFile, listPublicFiles, listPublicFolders } from "./library.functions";

export type Category = Tables<"categories">;
export type Folder = Tables<"folders">;
export type FileRow = Tables<"files">;
// What visitors (and the admin list) receive: storage paths stay on the server.
export type FileItem = Omit<FileRow, "storage_path" | "thumbnail_path"> & {
  thumbUrl: string | null;
  category: Pick<Category, "id" | "name" | "slug" | "color"> | null;
};

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
    queryFn: (): Promise<FileItem[]> => listPublicFiles({ data: f }),
  });

export const fileQuery = (id: string) =>
  queryOptions({
    queryKey: ["file", id],
    queryFn: (): Promise<FileItem | null> => getPublicFile({ data: { id } }),
  });

export const foldersQuery = () =>
  queryOptions({
    queryKey: ["folders"],
    queryFn: (): Promise<Folder[]> => listPublicFolders(),
  });

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: (): Promise<Category[]> => listPublicCategories(),
  });

export const libraryStatsQuery = () =>
  queryOptions({
    queryKey: ["library-stats"],
    queryFn: () => getLibraryStats(),
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
