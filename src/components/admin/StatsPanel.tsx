import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Download, Files, FolderClosed, HardDrive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { filesQuery, foldersQuery, libraryStatsQuery } from "@/lib/data";
import { formatBytes } from "@/lib/file-types";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { FileIcon } from "@/components/files/FileIcon";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = { downloads: { label: "Downloads", color: "var(--chart-1)" } } satisfies ChartConfig;

export function StatsPanel() {
  const stats = useQuery(libraryStatsQuery());
  const folders = useQuery(foldersQuery());
  const top = useQuery(filesQuery({ order: "popular", limit: 6 }));
  const series = useQuery({
    queryKey: ["admin-download-series", 30],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_download_stats", { _days: 30 });
      if (error) throw error;
      return (data ?? []).map((r) => ({ day: r.day, downloads: Number(r.downloads) }));
    },
  });

  const last30 = (series.data ?? []).reduce((a, r) => a + r.downloads, 0);

  const cards = [
    { icon: Files, label: "Files", value: stats.data?.count.toLocaleString() },
    { icon: HardDrive, label: "Storage used", value: stats.data ? formatBytes(stats.data.bytes) : undefined },
    { icon: Download, label: "Total downloads", value: stats.data?.downloads.toLocaleString() },
    { icon: FolderClosed, label: "Folders", value: folders.data?.length.toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Icon className="h-4 w-4 text-primary" /> {label}
            </div>
            <div className="mt-2 font-display text-2xl font-semibold">{value ?? <Skeleton className="h-7 w-16" />}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border bg-card p-4 sm:p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold">Downloads · last 30 days</h3>
            <span className="text-sm text-muted-foreground">{last30.toLocaleString()} total</span>
          </div>
          {series.isLoading ? (
            <Skeleton className="mt-4 h-56 w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="mt-4 h-56 w-full">
              <AreaChart data={series.data ?? []} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="dlFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-downloads)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-downloads)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={(d) => format(parseISO(d), "MMM d")} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(d) => format(parseISO(String(d)), "MMM d, yyyy")} />} />
                <Area type="monotone" dataKey="downloads" stroke="var(--color-downloads)" strokeWidth={2} fill="url(#dlFill)" />
              </AreaChart>
            </ChartContainer>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-4 sm:p-5">
          <h3 className="font-semibold">Most downloaded</h3>
          <ul className="mt-3 space-y-1">
            {(top.data ?? []).map((f, i) => (
              <li key={f.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                <span className="w-4 text-xs font-semibold text-muted-foreground">{i + 1}</span>
                <FileIcon ext={f.extension} />
                <span className="min-w-0 flex-1 truncate text-sm">{f.name}</span>
                <span className="text-sm font-semibold">{f.download_count.toLocaleString()}</span>
              </li>
            ))}
            {top.data && top.data.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No downloads yet</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
