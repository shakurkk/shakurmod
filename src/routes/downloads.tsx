import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { filesQuery } from "@/lib/data";
import { useViewMode } from "@/hooks/use-view-mode";
import { EmptyState, FileCollection, FilesSkeleton, PageHeader, ViewToggle } from "@/components/files/FileViews";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "Top Downloads — SHAKUR MOD" },
      { name: "description", content: "The most downloaded files on SHAKUR MOD right now." },
      { property: "og:title", content: "Top Downloads — SHAKUR MOD" },
      { property: "og:description", content: "The most downloaded files on SHAKUR MOD right now." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DownloadsPage,
});

function DownloadsPage() {
  const [mode, setMode] = useViewMode();
  const files = useQuery(filesQuery({ order: "popular", limit: 60 }));
  return (
    <div>
      <PageHeader
        title="Downloads"
        subtitle="The most popular files, ranked by total downloads."
        actions={<ViewToggle mode={mode} onChange={setMode} />}
      />
      {files.isLoading ? (
        <FilesSkeleton mode={mode} />
      ) : files.data && files.data.length ? (
        <FileCollection files={files.data} mode={mode} showDownloads />
      ) : (
        <EmptyState icon={<TrendingUp className="h-7 w-7" />} title="Nothing here yet" body="Popular files will show up once people start downloading." />
      )}
    </div>
  );
}
