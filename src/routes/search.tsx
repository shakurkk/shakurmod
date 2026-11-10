import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { filesQuery } from "@/lib/data";
import { useViewMode } from "@/hooks/use-view-mode";
import { EmptyState, FileCollection, FilesSkeleton, PageHeader, ViewToggle } from "@/components/files/FileViews";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): { q?: string } =>
    typeof s["q"] === "string" && s["q"].trim() ? { q: s["q"].slice(0, 80) } : {},
  head: () => ({
    meta: [
      { title: "Search — SHAKUR MOD" },
      { name: "description", content: "Search the SHAKUR MOD file library." },
      { property: "og:title", content: "Search — SHAKUR MOD" },
      { property: "og:description", content: "Search the SHAKUR MOD file library." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const [mode, setMode] = useViewMode();
  const files = useQuery({ ...filesQuery({ search: q, order: "recent" }), enabled: !!q });

  return (
    <div>
      <PageHeader
        title={q ? <>Results for “{q}”</> : "Search"}
        subtitle={q && files.data ? `${files.data.length} file${files.data.length === 1 ? "" : "s"} found` : "Type in the search bar above to find files."}
        actions={<ViewToggle mode={mode} onChange={setMode} />}
      />
      {!q ? null : files.isLoading ? (
        <FilesSkeleton mode={mode} />
      ) : files.data && files.data.length ? (
        <FileCollection files={files.data} mode={mode} />
      ) : (
        <EmptyState icon={<SearchX className="h-7 w-7" />} title="No matching files" body="Try a different word or check the spelling." />
      )}
    </div>
  );
}
