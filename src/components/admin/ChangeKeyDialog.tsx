import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { changeAdminKey } from "@/lib/admin-login.functions";
import { MIN_ADMIN_KEY_LENGTH, validateNewAdminKey } from "@/lib/admin-key-rules";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangeKeyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const change = useServerFn(changeAdminKey);
  const [oldKey, setOldKey] = useState("");
  const [newKey, setNewKey] = useState("");
  const [confirmKey, setConfirmKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setOldKey("");
    setNewKey("");
    setConfirmKey("");
    setError(null);
    setBusy(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const problem = validateNewAdminKey(oldKey, newKey, confirmKey);
    if (!oldKey) return setError("Enter the current admin key.");
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      const res = await change({ data: { oldKey, newKey, confirmKey } });
      if (!res.ok) {
        setError(res.error);
        setBusy(false);
        return;
      }
      toast.success("Admin key changed. Use the new key next time you sign in.");
      reset();
      onOpenChange(false);
    } catch {
      setError("Couldn't change the key. Please try again.");
      setBusy(false);
    }
  };

  const field = (id: string, label: string, value: string, set: (v: string) => void, autoComplete: string) => (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => {
          set(e.target.value);
          setError(null);
        }}
        className="h-11 rounded-full px-4"
      />
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change admin key</DialogTitle>
          <DialogDescription>
            Enter the current key, then choose a new one (at least {MIN_ADMIN_KEY_LENGTH} characters).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          {field("old-admin-key", "Current key", oldKey, setOldKey, "current-password")}
          {field("new-admin-key", "New key", newKey, setNewKey, "new-password")}
          {field("confirm-admin-key", "Confirm new key", confirmKey, setConfirmKey, "new-password")}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="pill" className="gap-2" disabled={busy || !oldKey || !newKey || !confirmKey}>
              {busy && <Loader2 className="animate-spin" />}
              Change key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
