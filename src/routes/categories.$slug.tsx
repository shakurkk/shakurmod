import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { categoriesQuery, filesQuery } from "@/lib/data";
import { useViewMode } from "@/hooks/use-view-mode";
import { EmptyState, FileCollection, FilesSkeleton, PageHeader, ViewToggle } from "@/components/files/FileViews";

export const Route = createFileRoute("/categories/$slug")({
  head: ({ params }) => {
    const name = params.slug.replace(/-/g, " ");
    return {
      meta: [
        { title: `${name} — Categories — SHAKUR MOD` },
        { name: "description", content: `Download ${name} files from SHAKUR MOD.` },
        { property: "og:title", content: `${name} — SHAKUR MOD` },
        { property: "og:description", content: `Download ${name} files from SHAKUR MOD.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [mode, setMode] = useViewMode();
  const cats = useQuery(categoriesQuery());
  const cat = cats.data?.find((c) => c.slug === slug);
  const files = useQuery({ ...filesQuery({ categoryId: cat?.id, order: "recent" }), enabled: !!cat });

  return (
    <div>
      <Link to="/categories" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> All categories
      </Link>
      <PageHeader
        title={cat?.name ?? (cats.isLoading ? "Loading…" : "Category not found")}
        actions={<ViewToggle mode={mode} onChange={setMode} />}
      />
      {cats.isLoading || (cat && files.isLoading) ? (
        <FilesSkeleton mode={mode} />
      ) : !cat ? (
        <EmptyState title="This category doesn't exist" body="It may have been renamed or removed." />
      ) : files.data && files.data.length ? (
        <FileCollection files={files.data} mode={mode} />
      ) : (
        <EmptyState title="No files in this category yet" />
      )}
    </div>
  );
}
