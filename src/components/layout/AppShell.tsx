import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Home,
  FolderClosed,
  Download,
  Tags,
  Info,
  Search,
  Menu,
  Plus,
  ShieldCheck,
  LogOut,
  X,
  HardDrive,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useViewer } from "@/lib/auth";
import { libraryStatsQuery } from "@/lib/data";
import { formatBytes, plural } from "@/lib/file-types";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/files", label: "My Files", icon: FolderClosed },
  { to: "/downloads", label: "Downloads", icon: Download },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/about", label: "About", icon: Info },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { viewer } = useViewer();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const stats = useQuery(libraryStatsQuery());

  const isActive = (to: string, exact?: boolean) => (exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`));

  return (
    <div className="flex h-full flex-col gap-1 px-3 pb-4">
      {viewer.isAdmin && (
        <div className="mb-3 mt-1 px-1">
          <Button asChild variant="fab" className="h-14 gap-3 px-5 text-sm font-semibold">
            <Link to="/admin" search={{ new: "file" }} onClick={onNavigate}>
              <Plus className="!h-5 !w-5" /> New
            </Link>
          </Button>
        </div>
      )}

      <nav className="flex flex-col gap-0.5" aria-label="Main">
        {NAV.map((item) => {
          const active = isActive(item.to, "exact" in item ? item.exact : false);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex h-9 items-center gap-4 rounded-full pl-4 pr-3 text-sm transition-colors",
                active
                  ? "bg-primary-soft font-semibold text-primary-soft-foreground"
                  : "text-sidebar-foreground hover:bg-accent",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}

        {viewer.isAdmin && (
          <>
            <div className="mx-4 my-2 h-px bg-border" />
            <Link
              to="/admin"
              onClick={onNavigate}
              className={cn(
                "flex h-9 items-center gap-4 rounded-full pl-4 pr-3 text-sm transition-colors",
                isActive("/admin")
                  ? "bg-primary-soft font-semibold text-primary-soft-foreground"
                  : "text-sidebar-foreground hover:bg-accent",
              )}
            >
              <ShieldCheck className="h-[18px] w-[18px]" />
              Admin dashboard
            </Link>
          </>
        )}
      </nav>

      <div className="mt-auto px-4 pt-6">
        <div className="flex items-center gap-2 text-sm text-sidebar-foreground">
          <HardDrive className="h-4 w-4 text-muted-foreground" /> Library
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-strong">
          <div
            className="h-full rounded-full bg-gradient-brand"
            style={{ width: `${Math.max(4, Math.min(100, ((stats.data?.bytes ?? 0) / (100 * 1024 ** 3)) * 100))}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {stats.data ? `${plural(stats.data.count, "file")} · ${formatBytes(stats.data.bytes)}` : "Loading…"}
        </p>
      </div>
    </div>
  );
}

function SearchBar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const current = useRouterState({
    select: (s) => (s.location.pathname === "/search" ? ((s.location.search as { q?: string }).q ?? "") : ""),
  });
  const [q, setQ] = useState(current);
  useEffect(() => setQ(current), [current]);

  return (
    <form
      role="search"
      className={cn("relative w-full", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const v = q.trim();
        if (v) navigate({ to: "/search", search: { q: v } });
      }}
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search in SHAKUR MOD"
        aria-label="Search files"
        className="h-12 w-full rounded-full bg-surface pl-12 pr-11 text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:bg-card focus:shadow-lift"
      />
      {q && (
        <button
          type="button"
          onClick={() => setQ("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}

function AccountMenu() {
  const { viewer } = useViewer();
  const qc = useQueryClient();
  const navigate = useNavigate();
  if (!viewer.user) {
    return (
      <Button asChild variant="ghost" size="sm" className="h-9 gap-1.5 rounded-full px-3 text-muted-foreground">
        <Link to="/auth" aria-label="Admin sign in">
          <ShieldCheck className="h-4 w-4" /> Admin
        </Link>
      </Button>
    );
  }
  const initial = (viewer.user.name ?? viewer.user.email ?? "?").charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account"
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground ring-offset-2 hover:ring-2 hover:ring-primary-soft"
        >
          {viewer.user.avatar ? (
            <img src={viewer.user.avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            initial
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate text-sm font-medium">{viewer.user.name ?? "Signed in"}</div>
          <div className="truncate text-xs text-muted-foreground">{viewer.user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {viewer.isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin">
              <ShieldCheck className="h-4 w-4" /> Admin dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={async () => {
            await qc.cancelQueries();
            await supabase.auth.signOut();
            qc.setQueryData(["viewer"], { user: null, isAdmin: false });
            navigate({ to: "/", replace: true });
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 bg-background/95 px-2 backdrop-blur sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-full lg:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="!h-5 !w-5" />
        </Button>
        <Link to="/" className="flex shrink-0 items-center pr-2 lg:w-[232px] lg:pl-2" aria-label="SHAKUR MOD home">
          <Logo className="hidden sm:inline-flex" />
          <Logo compact className="sm:hidden" />
        </Link>
        <SearchBar className="max-w-3xl flex-1" />
        <div className="ml-auto flex shrink-0 items-center pl-2">
          <AccountMenu />
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] bg-sidebar p-0 pt-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="px-5 pb-4">
            <Logo />
          </div>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[256px] shrink-0 lg:block">
          <SidebarContent />
        </aside>
        <main className="min-w-0 flex-1 px-2 pb-4 sm:px-4 lg:pl-0">
          <div className="min-h-[calc(100vh-5rem)] rounded-2xl bg-card px-4 py-5 shadow-card sm:px-6 sm:py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
