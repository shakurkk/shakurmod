import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ImagePlus, Loader2, UploadCloud, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { categoriesQuery, foldersQuery } from "@/lib/data";
import { ALLOWED_EXTENSIONS, MAX_FILE_BYTES, formatBytes, validateThumbnail, validateUpload } from "@/lib/file-types";
import { FileIcon } from "@/components/files/FileIcon";
import { getExtension } from "@/lib/file-types";
import { CategoryPicker, FolderPicker } from "./Pickers";
import { createFile } from "./upload";

type Item = { file: File; progress: number; status: "ready" | "uploading" | "done" | "error"; error?: string | undefined };

export function UploadDialog({
  open,
  onOpenChange,
  defaultFolder = null,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultFolder?: string | null;
}) {
  const qc = useQueryClient();
  const folders = useQuery(foldersQuery());
  const cats = useQuery(categoriesQuery());
  const inputRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState<string | null>(defaultFolder);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setItems([]);
    setName("");
    setDescription("");
    setThumb(null);
    setCategoryId(null);
  };

  const addFiles = (list: FileList | File[]) => {
    const next: Item[] = [];
    for (const file of Array.from(list)) {
      const check = validateUpload(file);
      if (!check.ok) {
        toast.error(`${file.name}: ${check.error}`);
        continue;
      }
      next.push({ file, progress: 0, status: "ready" });
    }
    setItems((prev) => {
      const merged = [...prev, ...next];
      if (merged.length === 1 && merged[0] && !name) setName(merged[0].file.name.replace(/\.[^.]+$/, ""));
      return merged;
    });
  };

  const single = items.length === 1;

  const start = async () => {
    setRunning(true);
    let ok = 0;
    for (let i = 0; i < items.length; i++) {
      const current = items[i];
      if (!current || current.status === "done") continue;
      setItems((p) => p.map((it, j) => (j === i ? { ...it, status: "uploading", progress: 0, error: undefined } : it)));
      try {
        await createFile(
          current.file,
          {
            name: single ? name : current.file.name.replace(/\.[^.]+$/, ""),
            description: single ? description : null,
            folderId,
            categoryId,
            thumbnail: single ? thumb : null,
          },
          (pct) => setItems((p) => p.map((it, j) => (j === i ? { ...it, progress: pct } : it))),
        );
        ok++;
        setItems((p) => p.map((it, j) => (j === i ? { ...it, status: "done", progress: 100 } : it)));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        setItems((p) => p.map((it, j) => (j === i ? { ...it, status: "error", error: msg } : it)));
      }
    }
    setRunning(false);
    qc.invalidateQueries({ queryKey: ["files"] });
    qc.invalidateQueries({ queryKey: ["library-stats"] });
    if (ok) toast.success(`${ok} file${ok === 1 ? "" : "s"} uploaded`);
  };

  const allDone = items.length > 0 && items.every((i) => i.status === "done");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (running) return;
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
          <DialogDescription>Up to {formatBytes(MAX_FILE_BYTES)} per file. APK, ZIP, RAR, PDF, images, videos and more.</DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!running) addFiles(e.dataTransfer.files);
          }}
          onClick={() => !running && inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${dragOver ? "border-primary bg-primary-soft/40" : "border-input hover:bg-accent"}`}
        >
          <UploadCloud className="h-9 w-9 text-primary" />
          <p className="mt-2 text-sm font-medium">Drop files here or click to browse</p>
          <p className="mt-1 text-xs text-muted-foreground">You can select several files at once</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {items.length > 0 && (
          <ul className="space-y-2">
            {items.map((it, i) => (
              <li key={`${it.file.name}-${i}`} className="rounded-xl border px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <FileIcon ext={getExtension(it.file.name)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{it.file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatBytes(it.file.size)}
                      {it.status === "uploading" && ` · ${Math.round(it.progress)}%`}
                      {it.status === "error" && <span className="text-destructive"> · {it.error}</span>}
                    </div>
                  </div>
                  {it.status === "done" ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : it.status === "error" ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : it.status === "uploading" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => setItems((p) => p.filter((_, j) => j !== i))}
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {it.status === "uploading" && <Progress value={it.progress} className="mt-2 h-1.5" />}
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <div className="grid gap-4">
            {single && (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="up-name">Display name</Label>
                  <Input id="up-name" value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="up-desc">Description</Label>
                  <Textarea id="up-desc" value={description} maxLength={4000} rows={3} onChange={(e) => setDescription(e.target.value)} placeholder="Version, features, install notes…" />
                </div>
              </>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Folder</Label>
                <FolderPicker folders={folders.data ?? []} value={folderId} onChange={setFolderId} />
              </div>
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <CategoryPicker categories={cats.data ?? []} value={categoryId} onChange={setCategoryId} />
              </div>
            </div>
            {single && (
              <div className="grid gap-1.5">
                <Label>Thumbnail (optional)</Label>
                <div className="flex items-center gap-3">
                  {thumb ? (
                    <img src={URL.createObjectURL(thumb)} alt="" className="h-14 w-14 rounded-lg border object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={() => thumbRef.current?.click()}>
                    {thumb ? "Change" : "Choose image"}
                  </Button>
                  {thumb && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setThumb(null)}>
                      Remove
                    </Button>
                  )}
                  <input
                    ref={thumbRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      const c = validateThumbnail(f);
                      if (!c.ok) toast.error(c.error);
                      else setThumb(f);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {allDone ? (
            <Button
              variant="pill"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          ) : (
            <Button variant="pill" disabled={!items.length || running} onClick={start}>
              {running ? <Loader2 className="animate-spin" /> : <UploadCloud />}
              {running ? "Uploading…" : `Upload ${items.length || ""}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
