import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Zap, Search, Download } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — SHAKUR MOD" },
      { name: "description", content: "SHAKUR MOD is a fast, secure library of mods, apps and files you can download for free." },
      { property: "og:title", content: "About SHAKUR MOD" },
      { property: "og:description", content: "A fast, secure library of mods, apps and files you can download for free." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

const FEATURES = [
  { icon: Search, title: "Find anything", body: "Search by name or description across every folder." },
  { icon: Download, title: "Direct downloads", body: "One tap, no sign-up, no waiting screens." },
  { icon: ShieldCheck, title: "Secure links", body: "Every download uses a private, short-lived link." },
  { icon: Zap, title: "Fast everywhere", body: "Built to feel quick on phones, tablets and desktops." },
];

function About() {
  return (
    <div className="mx-auto max-w-3xl py-4">
      <div className="flex items-center gap-4">
        <LogoMark className="h-14 w-14" />
        <div>
          <h1 className="text-3xl font-bold">
            SHAKUR <span className="text-gradient-brand">MOD</span>
          </h1>
          <p className="text-sm text-muted-foreground">Mods, apps & files — organized like a drive.</p>
        </div>
      </div>
      <p className="mt-6 leading-relaxed text-muted-foreground">
        SHAKUR MOD is a curated file library. Everything here is uploaded and maintained by the SHAKUR MOD team, so you
        can browse folders, explore categories and download what you need with confidence.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border bg-card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft">
              <Icon className="h-5 w-5 text-primary-soft-foreground" />
            </span>
            <h2 className="mt-4 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
