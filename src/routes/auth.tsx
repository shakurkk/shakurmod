import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, ShieldAlert, ShieldCheck, ArrowLeft, KeyRound, XCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { adminKeyLogin } from "@/lib/admin-login.functions";
import { supabase } from "@/integrations/supabase/client";
import { viewerQuery } from "@/lib/auth";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin sign in — SHAKUR MOD" },
      { name: "description", content: "Admin sign-in for the SHAKUR MOD dashboard." },
      { property: "og:title", content: "Admin sign in — SHAKUR MOD" },
      { property: "og:description", content: "Admin sign-in for the SHAKUR MOD dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const viewer = useQuery(viewerQuery());
  const [busy, setBusy] = useState(false);
  // "success" holds the welcome screen for ~2s before opening the dashboard.
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(0);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (viewer.data?.isAdmin && !success) navigate({ to: "/admin", replace: true });
  }, [viewer.data?.isAdmin, success, navigate]);

  useEffect(() => () => {
    if (redirectTimer.current) clearTimeout(redirectTimer.current);
  }, []);

  const login = useServerFn(adminKeyLogin);
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!key.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await login({ data: { key: key.trim() } });
      if (!res.ok) {
        const msg = res.error === "Incorrect admin key." ? "Incorrect Admin Key!" : res.error;
        setError(msg);
        setShake((n) => n + 1);
        toast.error(msg, { icon: <XCircle className="h-5 w-5 text-destructive" /> });
        setBusy(false);
        return;
      }
      const { error: sessErr } = await supabase.auth.setSession(res.session);
      if (sessErr) throw sessErr;
      setKey("");
      setSuccess(true);
      toast.success("Login Successful!", {
        description: "Welcome, Boss! 👑",
        icon: <CheckCircle2 className="h-5 w-5 text-success" />,
        duration: 2500,
      });
      await qc.invalidateQueries({ queryKey: ["viewer"] });
      redirectTimer.current = setTimeout(() => navigate({ to: "/admin", replace: true }), 2000);
    } catch {
      toast.error("Sign-in didn't complete. Please try again.");
      setBusy(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.setQueryData(["viewer"], { user: null, isAdmin: false });
  };

  const signedInNotAdmin = viewer.data?.user && !viewer.data.isAdmin;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-[420px] rounded-3xl border bg-card px-6 py-10 text-center shadow-lift sm:px-10">
        <Logo className="justify-center" />
        {success ? (
          <div role="status" aria-live="polite" className="animate-rise">
            <div className="mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-success/15 motion-safe:animate-pop">
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-success" fill="none" aria-hidden="true">
                <path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  stroke="currentColor"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="motion-safe:animate-draw-check"
                />
              </svg>
            </div>
            <h1 className="mt-5 text-xl font-semibold text-success">Login Successful!</h1>
            <p className="mt-2 text-lg font-medium">Welcome, Boss! 👑</p>
            <p className="mt-1 text-sm text-muted-foreground">Opening your admin dashboard…</p>
            <div className="mx-auto mt-6 h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-surface">
              <div className="h-full w-full origin-left rounded-full bg-success animate-progress" />
            </div>
          </div>
        ) : viewer.isLoading ? (
          <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted-foreground" />
        ) : signedInNotAdmin ? (
          <>
            <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="mt-4 text-xl font-semibold">Access denied</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This account isn't authorized to manage SHAKUR MOD.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button variant="outline" className="h-11 rounded-full" onClick={signOut}>
                Sign out
              </Button>
              <Button asChild variant="ghost" className="h-11 rounded-full">
                <Link to="/">Back to SHAKUR MOD</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
              <ShieldCheck className="h-7 w-7 text-primary-soft-foreground" />
            </div>
            <h1 className="mt-4 text-xl font-semibold">Admin sign in</h1>
            <p className="mt-2 text-sm text-muted-foreground">Enter the admin key to open the admin dashboard.</p>
            <form onSubmit={signIn} className="mt-7 flex flex-col gap-3 text-left">
              <label htmlFor="admin-key" className="sr-only">
                Admin key
              </label>
              <div key={shake} className={cn("relative", shake > 0 && "motion-safe:animate-shake")}>
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-key"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  placeholder="Admin key"
                  value={key}
                  readOnly={busy}
                  onChange={(e) => {
                    setKey(e.target.value);
                    setError(null);
                  }}
                  aria-invalid={!!error}
                  className="h-11 rounded-full pl-11"
                />
              </div>
              {error && (
                <p role="alert" className="flex items-center gap-2 px-2 text-sm font-medium text-destructive animate-rise">
                  <XCircle className="h-4 w-4 shrink-0" /> <span className="min-w-0">{error}</span>
                </p>
              )}
              <Button type="submit" variant="pill" className="h-11 w-full gap-2 text-sm font-medium" disabled={busy || !key.trim()}>
                {busy && <Loader2 className="animate-spin" />}
                {busy ? "Verifying…" : "Unlock dashboard"}
              </Button>
            </form>
            <Link to="/" className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to files
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
