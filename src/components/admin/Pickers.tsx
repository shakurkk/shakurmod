import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category, Folder } from "@/lib/data";

const ROOT = "__root__";
const NONE = "__none__";

function flatten(folders: Folder[], parent: string | null = null, depth = 0, exclude?: string | undefined): { f: Folder; depth: number }[] {
  return folders
    .filter((f) => f.parent_id === parent && f.id !== exclude)
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((f) => [{ f, depth }, ...flatten(folders, f.id, depth + 1, exclude)]);
}

export function FolderPicker({
  folders,
  value,
  onChange,
  exclude,
  rootLabel = "My Files (top level)",
}: {
  folders: Folder[];
  value: string | null;
  onChange: (v: string | null) => void;
  exclude?: string | undefined;
  rootLabel?: string;
}) {
  return (
    <Select value={value ?? ROOT} onValueChange={(v) => onChange(v === ROOT ? null : v)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ROOT}>{rootLabel}</SelectItem>
        {flatten(folders, null, 0, exclude).map(({ f, depth }) => (
          <SelectItem key={f.id} value={f.id}>
            <span style={{ paddingLeft: depth * 12 }}>{f.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>No category</SelectItem>
        {categories.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
