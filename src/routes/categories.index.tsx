import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Tag } from "lucide-react";
import { categoriesQuery, libraryStatsQuery } from "@/lib/data";
import { EmptyState, PageHeader } from "@/components/files/FileViews";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryTone } from "@/lib/category-colors";
import { plural } from "@/lib/file-types";

export const Route = createFileRoute("/categories/")({
  head: () => ({
    meta: [
      { title: "Categories — SHAKUR MOD" },
      { name: "description", content: "Explore SHAKUR MOD files by category: games, apps, tools, documents and more." },
      { property: "og:title", content: "Categories — SHAKUR MOD" },
      { property: "og:description", content: "Explore SHAKUR MOD files by category." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const cats = useQuery(categoriesQuery());
  const stats = useQuery(libraryStatsQuery());
  return (
    <div>
      <PageHeader title="Categories" subtitle="Find files by what they are." />
      {cats.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : cats.data && cats.data.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cats.data.map((c) => {
            const tone = categoryTone(c.color);
            return (
              <Link
                key={c.id}
                to="/categories/$slug"
                params={{ slug: c.slug }}
                className="group flex flex-col justify-between gap-6 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone.bg}`}>
                  <Tag className={`h-5 w-5 ${tone.text}`} />
                </span>
                <span>
                  <span className="block font-display font-semibold">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{plural(stats.data?.byCategory[c.id] ?? 0, "file")}</span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No categories yet" body="Categories will appear here once they're created." />
      )}
    </div>
  );
}
