import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Download, Files, HardDrive } from "lucide-react";
import { filesQuery, foldersQuery, libraryStatsQuery } from "@/lib/data";
import { formatBytes, plural } from "@/lib/file-types";
import { useViewMode } from "@/hooks/use-view-mode";
import {
  EmptyState,
  FileCollection,
  FilesSkeleton,
  FolderGrid,
  SectionTitle,
  ViewToggle,
} from "@/components/files/FileViews";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SHAKUR MOD — Download mods, apps & files" },
      { name: "description", content: "Browse the latest APKs, archives, documents and media on SHAKUR MOD and download them instantly." },
      { property: "og:title", content: "SHAKUR MOD — Download mods, apps & files" },
      { property: "og:description", content: "Browse the latest APKs, archives, documents and media on SHAKUR MOD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [mode, setMode] = useViewMode();
  const recent = useQuery(filesQuery({ order: "recent", limit: 15 }));
  const folders = useQuery(foldersQuery());
  const stats = useQuery(libraryStatsQuery());
  const rootFolders = (folders.data ?? []).filter((f) => !f.parent_id).slice(0, 10);

  return (
    <div className="space-y-9">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-hero px-5 py-7 sm:px-8 sm:py-9">
        <p className="text-sm font-medium text-primary">Welcome to</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
          SHAKUR <span className="text-gradient-brand">MOD</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Your home for mods, apps and files. Browse folders, search anything, and download in one tap — no account needed.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { icon: Files, label: stats.data ? plural(stats.data.count, "file") : "— files" },
            { icon: HardDrive, label: stats.data ? formatBytes(stats.data.bytes) : "—" },
            { icon: Download, label: stats.data ? plural(stats.data.downloads, "download") : "— downloads" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3.5 py-1.5 text-sm shadow-card">
              <Icon className="h-4 w-4 text-primary" /> {label}
            </span>
          ))}
        </div>
      </section>

      {rootFolders.length > 0 && (
        <section>
          <SectionTitle
            action={
              <Link to="/files" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            }
          >
            Suggested folders
          </SectionTitle>
          <FolderGrid folders={rootFolders} counts={stats.data?.byFolder} />
        </section>
      )}

      <section>
        <SectionTitle action={<ViewToggle mode={mode} onChange={setMode} />}>Recent files</SectionTitle>
        {recent.isLoading ? (
          <FilesSkeleton mode={mode} />
        ) : recent.data && recent.data.length ? (
          <FileCollection files={recent.data} mode={mode} />
        ) : (
          <EmptyState title="No files yet" body="New uploads will appear here as soon as they're published." />
        )}
      </section>
    </div>
  );
}
