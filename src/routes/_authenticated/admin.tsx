import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsPanel } from "@/components/admin/StatsPanel";
import { FilesPanel } from "@/components/admin/FilesPanel";
import { FoldersPanel, FolderDialog } from "@/components/admin/FoldersPanel";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";
import { UploadDialog } from "@/components/admin/UploadDialog";

type AdminSearch = { new?: "file" | "folder" };

export const Route = createFileRoute("/_authenticated/admin")({
  validateSearch: (s: Record<string, unknown>): AdminSearch =>
    s["new"] === "file" || s["new"] === "folder" ? { new: s["new"] } : {},
  // UI gate only — every write is also checked by the database's admin rules.
  beforeLoad: async ({ context }) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error || !data) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Admin dashboard — SHAKUR MOD" },
      { name: "description", content: "Manage SHAKUR MOD files, folders, categories and download statistics." },
      { property: "og:title", content: "Admin dashboard — SHAKUR MOD" },
      { property: "og:description", content: "Manage SHAKUR MOD content." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin" });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderDraft, setFolderDraft] = useState<{ name: string; description: string; parent_id: string | null } | null>(null);
  const [tab, setTab] = useState("files");

  useEffect(() => {
    if (search.new === "file") setUploadOpen(true);
    if (search.new === "folder") {
      setTab("folders");
      setFolderDraft({ name: "", description: "", parent_id: null });
    }
    if (search.new) navigate({ search: {}, replace: true });
  }, [search.new, navigate]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft">
          <ShieldCheck className="h-6 w-6 text-primary-soft-foreground" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">Admin dashboard</h1>
          <p className="text-sm text-muted-foreground">Only you can see this page.</p>
        </div>
      </div>

      <StatsPanel />

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="h-11 rounded-full bg-surface p-1">
          <TabsTrigger value="files" className="rounded-full px-4">Files</TabsTrigger>
          <TabsTrigger value="folders" className="rounded-full px-4">Folders</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-full px-4">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="files" className="mt-5">
          <FilesPanel onUpload={() => setUploadOpen(true)} />
        </TabsContent>
        <TabsContent value="folders" className="mt-5">
          <FoldersPanel onNew={() => setFolderDraft({ name: "", description: "", parent_id: null })} />
        </TabsContent>
        <TabsContent value="categories" className="mt-5">
          <CategoriesPanel />
        </TabsContent>
      </Tabs>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <FolderDialog draft={folderDraft} onClose={() => setFolderDraft(null)} />
    </div>
  );
}
