import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { requestDownload } from "@/lib/download.functions";

export function useDownload() {
  const fn = useServerFn(requestDownload);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const start = async (fileId: string) => {
    setBusy(fileId);
    try {
      const { url } = await fn({ data: { fileId } });
      window.location.href = url;
      toast.success("Download started");
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["files"] });
        qc.invalidateQueries({ queryKey: ["file", fileId] });
        qc.invalidateQueries({ queryKey: ["library-stats"] });
      }, 1200);
    } catch {
      toast.error("Couldn't start the download. Please try again.");
    } finally {
      setBusy(null);
    }
  };
  return { start, busy };
}

export function DownloadButton({
  fileId,
  label = "Download",
  iconOnly = false,
  ...props
}: { fileId: string; label?: string; iconOnly?: boolean } & Omit<ButtonProps, "onClick">) {
  const { start, busy } = useDownload();
  const loading = busy === fileId;
  return (
    <Button
      {...props}
      aria-label={iconOnly ? label : undefined}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        start(fileId);
      }}
      disabled={loading || props.disabled}
    >
      {loading ? <Loader2 className="animate-spin" /> : <Download />}
      {!iconOnly && label}
    </Button>
  );
}
