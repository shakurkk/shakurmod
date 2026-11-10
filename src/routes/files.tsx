import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { filesQuery, folderPath, foldersQuery, libraryStatsQuery } from "@/lib/data";
import { useViewMode } from "@/hooks/use-view-mode";
import {
  EmptyState,
  FileCollection,
  FilesSkeleton,
  FolderGrid,
  SectionTitle,
  ViewToggle,
} from "@/components/files/FileViews";

export const Route = createFileRoute("/files")({
  validateSearch: (s: Record<string, unknown>): { folder?: string } =>
    typeof s["folder"] === "string" && s["folder"] ? { folder: s["folder"] } : {},
  head: () => ({
    meta: [
      { title: "My Files — SHAKUR MOD" },
      { name: "description", content: "Browse every folder and file in the SHAKUR MOD library." },
      { property: "og:title", content: "My Files — SHAKUR MOD" },
      { property: "og:description", content: "Browse every folder and file in the SHAKUR MOD library." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FilesPage,
});

function FilesPage() {
  const { folder } = Route.useSearch();
  const [mode, setMode] = useViewMode();
  const folders = useQuery(foldersQuery());
  const stats = useQuery(libraryStatsQuery());
  const files = useQuery(filesQuery({ folderId: folder ?? null, order: "name" }));

  const all = folders.data ?? [];
  const children = all.filter((f) => (folder ? f.parent_id === folder : !f.parent_id));
  const path = folderPath(all, folder);
  const current = path.at(-1);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1 text-xl font-semibold">
          <Link
            to="/files"
            className="rounded-full px-3 py-1 font-display hover:bg-accent"
          >
            My Files
          </Link>
          {path.map((p, i) => (
            <Fragment key={p.id}>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
              {i === path.length - 1 ? (
                <span className="truncate px-3 py-1 font-display">{p.name}</span>
              ) : (
                <Link to="/files" search={{ folder: p.id }} className="truncate rounded-full px-3 py-1 font-display hover:bg-accent">
                  {p.name}
                </Link>
              )}
            </Fragment>
          ))}
        </nav>
        <ViewToggle mode={mode} onChange={setMode} />
      </div>

      {current?.description && <p className="-mt-2 mb-5 px-3 text-sm text-muted-foreground">{current.description}</p>}

      {children.length > 0 && (
        <section className="mb-8">
          <SectionTitle>Folders</SectionTitle>
          <FolderGrid folders={children} counts={stats.data?.byFolder} />
        </section>
      )}

      <section>
        <SectionTitle>Files</SectionTitle>
        {files.isLoading ? (
          <FilesSkeleton mode={mode} />
        ) : files.data && files.data.length ? (
          <FileCollection files={files.data} mode={mode} />
        ) : (
          <EmptyState
            title={children.length ? "No files in this folder" : "This folder is empty"}
            body={children.length ? "Open a folder above to see its files." : "Check back soon for new uploads."}
          />
        )}
      </section>
    </div>
  );
}
