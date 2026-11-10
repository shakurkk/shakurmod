import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeft, Calendar, HardDrive, Download, Folder, Tag, FileQuestion } from "lucide-react";
import { fileQuery, folderPath, foldersQuery } from "@/lib/data";
import { formatBytes, kindOf } from "@/lib/file-types";
import { FileIcon, KIND_BG } from "@/components/files/FileIcon";
import { DownloadButton } from "@/components/files/DownloadButton";
import { EmptyState } from "@/components/files/FileViews";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/file/$id")({
  head: () => ({
    meta: [
      { title: "File details — SHAKUR MOD" },
      { name: "description", content: "View file details and download from SHAKUR MOD." },
      { property: "og:title", content: "File on SHAKUR MOD" },
      { property: "og:description", content: "View file details and download from SHAKUR MOD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FilePage,
});

function FilePage() {
  const { id } = Route.useParams();
  const file = useQuery(fileQuery(id));
  const folders = useQuery(foldersQuery());

  if (file.isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Skeleton className="aspect-[4/3] rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-11 w-40 rounded-full" />
        </div>
      </div>
    );
  }

  const f = file.data;
  if (!f) {
    return <EmptyState icon={<FileQuestion className="h-7 w-7" />} title="File not found" body="It may have been removed by the owner." />;
  }

  const path = folderPath(folders.data ?? [], f.folder_id);
  const kind = kindOf(f.extension);

  const meta = [
    { icon: HardDrive, label: "Size", value: formatBytes(f.size_bytes) },
    { icon: Calendar, label: "Uploaded", value: format(new Date(f.created_at), "MMMM d, yyyy") },
    { icon: Download, label: "Downloads", value: f.download_count.toLocaleString() },
    { icon: Tag, label: "Type", value: f.extension.toUpperCase() },
  ];

  return (
    <div>
      <Link
        to="/files"
        search={f.folder_id ? { folder: f.folder_id } : {}}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to {path.at(-1)?.name ?? "My Files"}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
        <div className={cn("flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border", KIND_BG[kind])}>
          {f.thumbUrl ? (
            <img src={f.thumbUrl} alt={f.name} className="h-full w-full object-cover" />
          ) : (
            <FileIcon ext={f.extension} className="h-24 w-24" />
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            {f.category && (
              <Link
                to="/categories/$slug"
                params={{ slug: f.category.slug }}
                className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-soft-foreground"
              >
                {f.category.name}
              </Link>
            )}
            {path.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground">
                <Folder className="h-3.5 w-3.5" /> {path.map((p) => p.name).join(" / ")}
              </span>
            )}
          </div>
          <h1 className="mt-3 break-words text-2xl font-bold sm:text-3xl">{f.name}</h1>
          {f.description ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{f.description}</p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No description provided.</p>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-3">
            {meta.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl bg-surface/70 px-4 py-3">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </dt>
                <dd className="mt-1 text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <DownloadButton fileId={f.id} label={`Download · ${formatBytes(f.size_bytes)}`} variant="pill" size="lg" className="mt-6 h-12 w-full sm:w-auto sm:self-start" />
          <p className="mt-3 text-xs text-muted-foreground">Secure link · expires a few minutes after you click.</p>
        </div>
      </div>
    </div>
  );
}
