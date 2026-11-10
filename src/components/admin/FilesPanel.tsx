import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreVertical, Pencil, Trash2, Search, UploadCloud, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { filesQuery, foldersQuery, type FileItem } from "@/lib/data";
import { formatBytes } from "@/lib/file-types";
import { FileIcon } from "@/components/files/FileIcon";
import { EmptyState } from "@/components/files/FileViews";
import { Skeleton } from "@/components/ui/skeleton";
import { EditFileDialog } from "./EditFileDialog";
import { deleteFile } from "./upload";

export function FilesPanel({ onUpload }: { onUpload: () => void }) {
  const qc = useQueryClient();
  const files = useQuery(filesQuery({ order: "recent", limit: 1000 }));
  const folders = useQuery(foldersQuery());
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<FileItem | null>(null);
  const [deleting, setDeleting] = useState<FileItem | null>(null);
  const [busy, setBusy] = useState(false);

  const folderName = useMemo(() => new Map((folders.data ?? []).map((f) => [f.id, f.name])), [folders.data]);
  const list = (files.data ?? []).filter((f) => !q || f.name.toLowerCase().includes(q.toLowerCase()));

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteFile(deleting);
      qc.invalidateQueries({ queryKey: ["files"] });
      qc.invalidateQueries({ queryKey: ["library-stats"] });
      toast.success("File deleted");
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete file");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter files" className="h-10 rounded-full pl-9" />
        </div>
        <Button variant="pill" className="h-10" onClick={onUpload}>
          <UploadCloud /> Upload
        </Button>
      </div>

      {files.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState title={q ? "No matching files" : "No files uploaded yet"} body={q ? undefined : "Click Upload to add your first file."} />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <div className="hidden grid-cols-[minmax(0,1fr)_140px_100px_110px_90px_48px] gap-3 border-b bg-muted px-4 py-2.5 text-xs font-medium text-muted-foreground md:grid">
            <span>Name</span>
            <span>Folder</span>
            <span>Size</span>
            <span>Uploaded</span>
            <span>Downloads</span>
            <span />
          </div>
          <ul>
            {list.map((f) => (
              <li
                key={f.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-2.5 last:border-b-0 hover:bg-accent/60 md:grid-cols-[minmax(0,1fr)_140px_100px_110px_90px_48px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {f.thumbUrl ? (
                    <img src={f.thumbUrl} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface">
                      <FileIcon ext={f.extension} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{f.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {f.category?.name ?? "No category"}
                      <span className="md:hidden"> · {formatBytes(f.size_bytes)} · {f.download_count} downloads</span>
                    </div>
                  </div>
                </div>
                <span className="hidden truncate text-sm text-muted-foreground md:block">
                  {f.folder_id ? (folderName.get(f.folder_id) ?? "—") : "Top level"}
                </span>
                <span className="hidden text-sm text-muted-foreground md:block">{formatBytes(f.size_bytes)}</span>
                <span className="hidden text-sm text-muted-foreground md:block">{format(new Date(f.created_at), "MMM d, yyyy")}</span>
                <span className="hidden text-sm font-medium md:block">{f.download_count.toLocaleString()}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label={`Actions for ${f.name}`}>
                      <MoreVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/file/$id" params={{ id: f.id }}>
                        <ExternalLink className="h-4 w-4" /> Open public page
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditing(f)}>
                      <Pencil className="h-4 w-4" /> Edit details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(f)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        </div>
      )}

      <EditFileDialog file={editing} onClose={() => setEditing(null)} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && !busy && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The file is removed from storage permanently and visitors can no longer download it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
