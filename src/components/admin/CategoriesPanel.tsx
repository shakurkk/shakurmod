import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, libraryStatsQuery, slugify } from "@/lib/data";
import { CATEGORY_COLORS, categoryTone, type CategoryColor } from "@/lib/category-colors";
import { EmptyState } from "@/components/files/FileViews";
import { cn } from "@/lib/utils";
import { plural } from "@/lib/file-types";

function ColorDots({ value, onChange }: { value: string; onChange: (c: CategoryColor) => void }) {
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label="Color">
      {CATEGORY_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          onClick={() => onChange(c)}
          className={cn("h-6 w-6 rounded-full ring-offset-2 ring-offset-card", categoryTone(c).dot, value === c && "ring-2 ring-ring")}
        />
      ))}
    </div>
  );
}

export function CategoriesPanel() {
  const qc = useQueryClient();
  const cats = useQuery(categoriesQuery());
  const stats = useQuery(libraryStatsQuery());
  const [name, setName] = useState("");
  const [color, setColor] = useState<CategoryColor>("blue");
  const [edit, setEdit] = useState<{ id: string; name: string; color: string } | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["files"] });
  };

  const create = async () => {
    const n = name.trim();
    if (!n) return;
    const slug = slugify(n) || `cat-${Date.now()}`;
    const { error } = await supabase.from("categories").insert({ name: n, slug, color });
    if (error) { toast.error(error.code === "23505" ? "A category with that name already exists" : error.message); return; }
    setName("");
    refresh();
    toast.success("Category added");
  };

  const save = async () => {
    if (!edit || !edit.name.trim()) return;
    const { error } = await supabase
      .from("categories")
      .update({ name: edit.name.trim(), slug: slugify(edit.name) || `cat-${Date.now()}`, color: edit.color })
      .eq("id", edit.id);
    if (error) { toast.error(error.code === "23505" ? "A category with that name already exists" : error.message); return; }
    setEdit(null);
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
    toast.success("Category deleted — its files are now uncategorized");
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 rounded-xl border bg-muted/50 p-4 sm:flex-row sm:items-center">
        <Input
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="New category, e.g. Games"
          className="h-10 bg-card sm:max-w-xs"
        />
        <ColorDots value={color} onChange={setColor} />
        <Button variant="pill" className="h-10 sm:ml-auto" onClick={create} disabled={!name.trim()}>
          <Plus /> Add category
        </Button>
      </div>

      {(cats.data ?? []).length === 0 ? (
        <EmptyState title="No categories yet" body="Add categories like Games, Apps or Tools to help visitors browse." />
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(cats.data ?? []).map((c) => {
            const tone = categoryTone(c.color);
            const isEditing = edit?.id === c.id;
            return (
              <li key={c.id} className="flex min-w-0 items-center gap-3 rounded-xl border px-4 py-3">
                <span className={cn("h-3 w-3 shrink-0 rounded-full", tone.dot)} />
                {isEditing ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Input value={edit.name} maxLength={60} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="h-9" />
                    <ColorDots value={edit.color} onChange={(col) => setEdit({ ...edit, color: col })} />
                  </div>
                ) : (
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{plural(stats.data?.byCategory[c.id] ?? 0, "file")}</div>
                  </div>
                )}
                {isEditing ? (
                  <>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label="Save" onClick={save}>
                      <Check />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label="Cancel" onClick={() => setEdit(null)}>
                      <X />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label={`Edit ${c.name}`} onClick={() => setEdit({ id: c.id, name: c.name, color: c.color })}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-destructive" aria-label={`Delete ${c.name}`} onClick={() => remove(c.id)}>
                      <Trash2 />
                    </Button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
