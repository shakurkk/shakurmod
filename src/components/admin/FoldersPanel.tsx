import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Folder as FolderIcon, FolderPlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { foldersQuery, libraryStatsQuery, type Folder } from "@/lib/data";
import { EmptyState } from "@/components/files/FileViews";
import { FolderPicker } from "./Pickers";
import { plural } from "@/lib/file-types";

type Draft = { id?: string; name: string; description: string; parent_id: string | null };

export function FolderDialog({ draft, onClose }: { draft: Draft | null; onClose: () => void }) {
  const qc = useQueryClient();
  const folders = useQuery(foldersQuery());
  const [d, setD] = useState<Draft>({ name: "", description: "", parent_id: null });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (draft) setD(draft);
  }, [draft]);

  const save = async () => {
    if (!d.name.trim()) { toast.error("Folder name is required"); return; }
    setSaving(true);
    const payload = { name: d.name.trim(), description: d.description.trim() || null, parent_id: d.parent_id };
    const { error } = d.id
      ? await supabase.from("folders").update(payload).eq("id", d.id)
      : await supabase.from("folders").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["folders"] });
    toast.success(d.id ? "Folder updated" : "Folder created");
    onClose();
  };

  return (
    <Dialog open={!!draft} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{d.id ? "Edit folder" : "New folder"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="fd-name">Name</Label>
            <Input id="fd-name" autoFocus value={d.name} maxLength={120} onChange={(e) => setD({ ...d, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && save()} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fd-desc">Description (optional)</Label>
            <Textarea id="fd-desc" rows={2} maxLength={1000} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Inside</Label>
            <FolderPicker folders={folders.data ?? []} value={d.parent_id} exclude={d.id} onChange={(v) => setD({ ...d, parent_id: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="pill" onClick={save} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />} {d.id ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FoldersPanel({ onNew }: { onNew: () => void }) {
  const qc = useQueryClient();
  const folders = useQuery(foldersQuery());
  const stats = useQuery(libraryStatsQuery());
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Folder | null>(null);

  const all = folders.data ?? [];
  const tree = (parent: string | null, depth: number): { f: Folder; depth: number }[] =>
    all.filter((f) => f.parent_id === parent).flatMap((f) => [{ f, depth }, ...tree(f.id, depth + 1)]);
  const rows = tree(null, 0);

  const remove = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("folders").delete().eq("id", deleting.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["folders"] });
    qc.invalidateQueries({ queryKey: ["files"] });
    toast.success("Folder deleted");
    setDeleting(null);
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="pill" className="h-10" onClick={onNew}>
          <FolderPlus /> New folder
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No folders yet" body="Create folders to organize your files like a drive." />
      ) : (
        <ul className="overflow-hidden rounded-xl border">
          {rows.map(({ f, depth }) => (
            <li key={f.id} className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0 hover:bg-accent/60">
              <span style={{ width: depth * 20 }} className="shrink-0" />
              <FolderIcon className="h-5 w-5 shrink-0 fill-muted-foreground/25 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{f.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {plural(stats.data?.byFolder[f.id] ?? 0, "file")}{f.description ? ` · ${f.description}` : ""}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                aria-label={`Edit ${f.name}`}
                onClick={() => setEditing({ id: f.id, name: f.name, description: f.description ?? "", parent_id: f.parent_id })}
              >
                <Pencil />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-destructive" aria-label={`Delete ${f.name}`} onClick={() => setDeleting(f)}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <FolderDialog draft={editing} onClose={() => setEditing(null)} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Sub-folders are deleted too. Files inside are kept and moved to the top level of My Files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
