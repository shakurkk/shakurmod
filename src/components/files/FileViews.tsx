import { Link } from "@tanstack/react-router";
import { format, formatDistanceToNow } from "date-fns";
import { Folder as FolderIcon, LayoutGrid, List, FolderOpen } from "lucide-react";
import type { ReactNode } from "react";
import type { FileItem, Folder } from "@/lib/data";
import { formatBytes, kindOf, plural } from "@/lib/file-types";
import { FileIcon, KIND_BG } from "./FileIcon";
import { DownloadButton } from "./DownloadButton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/hooks/use-view-mode";

export function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-full border border-input bg-card p-0.5" role="group" aria-label="View mode">
      {(["list", "grid"] as const).map((m) => {
        const Icon = m === "grid" ? LayoutGrid : List;
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            aria-pressed={active}
            aria-label={m === "grid" ? "Grid view" : "List view"}
            className={cn(
              "flex h-8 w-11 items-center justify-center rounded-full transition-colors",
              active ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground hover:bg-accent",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[0.95rem] font-semibold text-foreground">{children}</h2>
      {action}
    </div>
  );
}

export function FolderGrid({ folders, counts }: { folders: Folder[]; counts?: Record<string, number> | undefined }) {
  if (!folders.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {folders.map((f) => (
        <Link
          key={f.id}
          to="/files"
          search={{ folder: f.id }}
          className="group flex items-center gap-3 rounded-xl bg-surface/70 px-4 py-3.5 transition-colors hover:bg-surface-strong"
        >
          <FolderIcon className="h-5 w-5 shrink-0 fill-muted-foreground/25 text-muted-foreground group-hover:text-primary" />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{f.name}</div>
            {counts && <div className="text-xs text-muted-foreground">{plural(counts[f.id] ?? 0, "file")}</div>}
          </div>
        </Link>
      ))}
    </div>
  );
}

function Thumb({ file, className }: { file: FileItem; className?: string }) {
  const kind = kindOf(file.extension);
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden", KIND_BG[kind], className)}>
      {file.thumbUrl ? (
        <img src={file.thumbUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <FileIcon ext={file.extension} className="h-12 w-12 opacity-90" />
      )}
      <span className="absolute left-2 top-2 rounded-md bg-card/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-card">
        {file.extension}
      </span>
    </div>
  );
}

export function FileGrid({ files }: { files: FileItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {files.map((f, i) => (
        <div
          key={f.id}
          style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
          className="group relative animate-rise flex flex-col overflow-hidden rounded-xl bg-surface/70 p-2 transition-all hover:bg-surface-strong"
        >
          <Link
            to="/file/$id"
            params={{ id: f.id }}
            className="flex items-center gap-2 px-1.5 pb-2 pt-1 after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
          >
            <FileIcon ext={f.extension} className="h-4 w-4" />
            <span className="truncate text-sm font-medium">{f.name}</span>
          </Link>
          <Thumb file={f} className="aspect-[4/3] rounded-lg bg-card" />
          <div className="flex items-center justify-between gap-2 px-1.5 pt-2">
            <span className="truncate text-xs text-muted-foreground">
              {formatBytes(f.size_bytes)} · {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
            </span>
            <DownloadButton fileId={f.id} iconOnly size="icon" variant="ghost" className="relative z-10 h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FileList({ files, showDownloads = false }: { files: FileItem[]; showDownloads?: boolean | undefined }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="hidden grid-cols-[minmax(0,1fr)_140px_110px_90px_56px] items-center gap-4 border-b px-4 py-2.5 text-xs font-medium text-muted-foreground md:grid">
        <span>Name</span>
        <span>Uploaded</span>
        <span>Size</span>
        <span>{showDownloads ? "Downloads" : "Category"}</span>
        <span />
      </div>
      <ul>
        {files.map((f) => (
          <li
            key={f.id}
            className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b px-4 py-2.5 transition-colors last:border-b-0 hover:bg-accent md:grid-cols-[minmax(0,1fr)_140px_110px_90px_56px]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <FileIcon ext={f.extension} />
              <span className="min-w-0">
                <Link
                  to="/file/$id"
                  params={{ id: f.id }}
                  className="block truncate text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {f.name}
                </Link>
                <span className="block truncate text-xs text-muted-foreground md:hidden">
                  {formatBytes(f.size_bytes)} · {format(new Date(f.created_at), "MMM d, yyyy")}
                </span>
              </span>
            </span>
            <span className="hidden text-sm text-muted-foreground md:block">
              {format(new Date(f.created_at), "MMM d, yyyy")}
            </span>
            <span className="hidden text-sm text-muted-foreground md:block">{formatBytes(f.size_bytes)}</span>
            <span className="hidden truncate text-sm text-muted-foreground md:block">
              {showDownloads ? f.download_count.toLocaleString() : (f.category?.name ?? "—")}
            </span>
            <DownloadButton fileId={f.id} iconOnly size="icon" variant="ghost" className="relative z-10 h-9 w-9 justify-self-end rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FileCollection({ files, mode, showDownloads }: { files: FileItem[]; mode: ViewMode; showDownloads?: boolean | undefined }) {
  return mode === "grid" ? <FileGrid files={files} /> : <FileList files={files} showDownloads={showDownloads} />;
}

export function FilesSkeleton({ mode = "grid" }: { mode?: ViewMode }) {
  if (mode === "list") {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[4/4] w-full rounded-xl" />
      ))}
    </div>
  );
}

export function EmptyState({ title, body, icon }: { title: string; body?: string | undefined; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface text-muted-foreground">
        {icon ?? <FolderOpen className="h-7 w-7" />}
      </div>
      <p className="font-display text-base font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
