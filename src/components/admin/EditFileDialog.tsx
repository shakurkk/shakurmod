import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, foldersQuery, type FileItem } from "@/lib/data";
import { validateThumbnail } from "@/lib/file-types";
import { CategoryPicker, FolderPicker } from "./Pickers";
import { uploadThumbnail } from "./upload";

export function EditFileDialog({ file, onClose }: { file: FileItem | null; onClose: () => void }) {
  const qc = useQueryClient();
  const folders = useQuery(foldersQuery());
  const cats = useQuery(categoriesQuery());
  const thumbRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [removeThumb, setRemoveThumb] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!file) return;
    setName(file.name);
    setDescription(file.description ?? "");
    setFolderId(file.folder_id);
    setCategoryId(file.category_id);
    setThumb(null);
    setRemoveThumb(false);
  }, [file]);

  const save = async () => {
    if (!file) return;
    if (!name.trim()) { toast.error("Name can't be empty"); return; }
    setSaving(true);
    try {
      let thumbnail_path = file.thumbnail_path;
      if (thumb) thumbnail_path = await uploadThumbnail(file.id, thumb);
      else if (removeThumb) thumbnail_path = null;

      const { error } = await supabase
        .from("files")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          folder_id: folderId,
          category_id: categoryId,
          thumbnail_path,
        })
        .eq("id", file.id);
      if (error) throw error;
      if (file.thumbnail_path && file.thumbnail_path !== thumbnail_path) {
        await supabase.storage.from("thumbnails").remove([file.thumbnail_path]);
      }
      qc.invalidateQueries({ queryKey: ["files"] });
      qc.invalidateQueries({ queryKey: ["file", file.id] });
      qc.invalidateQueries({ queryKey: ["library-stats"] });
      toast.success("File updated");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save changes");
    } finally {
      setSaving(false);
    }
  };

  const preview = thumb ? URL.createObjectURL(thumb) : removeThumb ? null : file?.thumbUrl;

  return (
    <Dialog open={!!file} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit file</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ed-name">Name</Label>
            <Input id="ed-name" value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ed-desc">Description</Label>
            <Textarea id="ed-desc" rows={4} maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
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
          <div className="grid gap-1.5">
            <Label>Thumbnail</Label>
            <div className="flex flex-wrap items-center gap-3">
              {preview ? (
                <img src={preview} alt="" className="h-16 w-16 rounded-lg border object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  <ImagePlus className="h-5 w-5" />
                </div>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => thumbRef.current?.click()}>
                {preview ? "Replace" : "Add image"}
              </Button>
              {preview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setThumb(null);
                    setRemoveThumb(true);
                  }}
                >
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
                  else {
                    setThumb(f);
                    setRemoveThumb(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="pill" onClick={save} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
